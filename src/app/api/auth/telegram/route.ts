import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Validate Telegram WebApp initData signature
function validateTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return false;

    // Sort parameters alphabetically
    const keys = Array.from(params.keys())
      .filter((key) => key !== "hash")
      .sort();

    // Create the data check string
    const dataCheckString = keys
      .map((key) => `${key}=${params.get(key)}`)
      .join("\n");

    // Secret key is HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Compute the hash
    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return computedHash === hash;
  } catch (e) {
    console.error("Telegram initData validation failed:", e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { initData } = body;

    if (!initData) {
      return NextResponse.json(
        { error: "initData is required" },
        { status: 400 }
      );
    }

    // 1. Get Telegram Bot Token
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const isDev = process.env.NODE_ENV === "development";

    // 2. Validate Signature
    if (botToken) {
      const isValid = validateTelegramInitData(initData, botToken);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid Telegram signature" },
          { status: 401 }
        );
      }
    } else if (!isDev) {
      // In production, we MUST have the token set
      console.error("TELEGRAM_BOT_TOKEN is not defined in production environment.");
      return NextResponse.json(
        { error: "Telegram Auth is misconfigured on the server" },
        { status: 500 }
      );
    } else {
      console.warn("TELEGRAM_BOT_TOKEN is missing, bypassing validation in DEVELOPMENT mode.");
    }

    // 3. Extract User parameters from query string
    const params = new URLSearchParams(initData);
    const userJsonStr = params.get("user");
    if (!userJsonStr) {
      return NextResponse.json(
        { error: "User parameters not found in initData" },
        { status: 400 }
      );
    }

    let tgUser;
    try {
      tgUser = JSON.parse(userJsonStr);
    } catch {
      return NextResponse.json(
        { error: "Malformed user JSON in initData" },
        { status: 400 }
      );
    }

    const tgId = tgUser.id;
    if (!tgId) {
      return NextResponse.json(
        { error: "Telegram User ID is missing" },
        { status: 400 }
      );
    }

    // 4. Generate deterministic email and secure cryptographic password
    const email = `tg_${tgId}@telegram.theprofessor.xyz`;
    
    // Hash key to generate a deterministic, highly secure password
    // Using a salt ensures that even if user_id is public, the password cannot be generated without the Bot Token
    const salt = botToken || "dev-telegram-salt-fallback-123456";
    const password = crypto
      .createHmac("sha256", salt)
      .update(tgId.toString())
      .digest("hex");

    // 5. Look up user in Supabase by querying the auth.users table directly
    const { data: userData, error: findError } = await (supabaseAdmin as any)
      .schema("auth")
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      console.error("Supabase find user error:", findError);
      return NextResponse.json(
        { error: "Database lookup failed" },
        { status: 500 }
      );
    }

    let userId = userData?.id;

    if (!userData) {
      // Create user if not exists
      const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Scholar";
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: tgUser.first_name || "",
          last_name: tgUser.last_name || "",
          username: tgUser.username || `tg_${tgId}`,
          telegram_id: tgId
        }
      });

      if (createError || !newUser.user) {
        console.error("Supabase user creation error:", createError);
        return NextResponse.json(
          { error: createError?.message || "Failed to create user account" },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      // Create their public profiles entry
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          alias: name,
          username: tgUser.username || `tg_${tgId}`,
          first_name: tgUser.first_name || "",
          last_name: tgUser.last_name || "",
          current_streak: 0,
          xp_total: 0,
          credits: 100, // 100 starter credits
          has_onboarded: false,
          plan_status: 'free',
          last_replenishment_date: new Date().toISOString()
        });

      if (profileError) {
        console.error("Supabase profile creation error:", profileError);
        // Continue anyway since auth account is created
      }
    }

    // 6. Return credentials so client can sign in
    return NextResponse.json({
      success: true,
      email,
      password
    });
  } catch (err: any) {
    console.error("Telegram auth endpoint exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
