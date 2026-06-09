export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let name = "";
        let email = "";
        let password = "";
        let confirm = "";

        if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            name = formData.get("name")?.toString().trim() || "";
            email = formData.get("email")?.toString().trim() || "";
            password = formData.get("password")?.toString() || "";
            confirm = formData.get("confirm")?.toString() || "";
        } else {
            const body = await req.json().catch(() => ({}));
            name = (body.name || "").trim();
            email = (body.email || "").trim();
            password = body.password || "";
            confirm = body.confirm || "";
        }

        if (!name || !email || !password || !confirm) {
            return NextResponse.redirect(new URL("/fallback-signup.html?error=" + encodeURIComponent("All fields are required."), req.url), 303);
        }

        if (password !== confirm) {
            return NextResponse.redirect(new URL("/fallback-signup.html?error=" + encodeURIComponent("Passwords do not match."), req.url), 303);
        }

        if (password.length < 6) {
            return NextResponse.redirect(new URL("/fallback-signup.html?error=" + encodeURIComponent("Password must be at least 6 characters."), req.url), 303);
        }

        const supabase = await createClient();
        
        // Sign up user via Supabase Auth
        const { data: { user }, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    alias: name,
                }
            }
        });

        if (signupError) {
            return NextResponse.redirect(new URL("/fallback-signup.html?error=" + encodeURIComponent(signupError.message), req.url), 303);
        }

        if (user) {
            // Check if profile exists, otherwise create it
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", user.id)
                .single();

            if (!profile) {
                // Insert profile (mimicking profile GET/creation flow)
                const { error: createError } = await supabase
                    .from("profiles")
                    .insert({
                        id: user.id,
                        alias: name,
                        current_streak: 0,
                        xp_total: 0,
                        credits: 100, // 100 starter credits
                        has_onboarded: false,
                        plan_status: 'free',
                        last_replenishment_date: new Date().toISOString()
                    });
                if (createError) {
                    console.error("Profile creation error on fallback signup:", createError);
                }
            }
        }

        // Successfully created! Redirect to login with confirmation info
        return NextResponse.redirect(new URL("/fallback-login.html?error=" + encodeURIComponent("Account created! Please sign in below. If confirmation is required, check your email."), req.url), 303);
    } catch (err: any) {
        console.error("Auth signup error:", err);
        return NextResponse.redirect(new URL("/fallback-signup.html?error=" + encodeURIComponent(err.message || "An unexpected error occurred."), req.url), 303);
    }
}
