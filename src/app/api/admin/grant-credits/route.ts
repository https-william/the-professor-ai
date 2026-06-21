export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch user profile to get their role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Admin authorization check
    const email = user.email;
    const role = profile?.role;

    if (!isAdmin(email, role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Validate request body
    const body = await req.json().catch(() => ({}));
    const { userId, amount } = body;

    if (!userId || typeof amount !== "number") {
      return NextResponse.json({ error: "Missing userId or valid amount" }, { status: 400 });
    }

    // 5. Create admin client bypassing RLS to update user credits
    const adminClient = createAdminClient();

    // Fetch the target user's current credits
    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (targetError) {
      return NextResponse.json({ error: "Target user profile not found" }, { status: 404 });
    }

    const currentCredits = targetProfile.credits ?? 0;
    const newCredits = Math.max(0, currentCredits + amount);

    // Update target profile credits
    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId)
      .select("id, credits, alias")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully granted ${amount} credits to ${updatedProfile.alias || "user"}. New balance: ${updatedProfile.credits}.`,
      profile: updatedProfile
    });
  } catch (error: any) {
    console.error("Admin Grant-Credits Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
