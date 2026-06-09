export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let email = "";
        let password = "";

        if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            email = formData.get("email")?.toString().trim() || "";
            password = formData.get("password")?.toString() || "";
        } else {
            const body = await req.json().catch(() => ({}));
            email = (body.email || "").trim();
            password = body.password || "";
        }
        
        if (!email || !password) {
            return NextResponse.redirect(new URL("/fallback-login.html?error=" + encodeURIComponent("Email and password are required."), req.url), 303);
        }

        const supabase = await createClient();
        const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            let msg = loginError.message;
            if (msg.toLowerCase().includes("invalid login credentials") || msg.toLowerCase().includes("invalid credentials")) {
                msg = "Hmm, that email or password doesn't match our notes. Try checking for typos?";
            } else if (msg.toLowerCase().includes("email not confirmed")) {
                msg = "Almost there! We sent a confirmation link to your email. Click it to unlock your account.";
            } else if (msg.toLowerCase().includes("rate limit")) {
                msg = "Whoa, slow down a bit! You've tried logging in too many times recently. Take a breath and try again in a minute.";
            }
            return NextResponse.redirect(new URL("/fallback-login.html?error=" + encodeURIComponent(msg), req.url), 303);
        }

        // Successfully logged in! Redirect to legacy dashboard
        return NextResponse.redirect(new URL("/legacy/index.html", req.url), 303);
    } catch (err: any) {
        console.error("Auth login error:", err);
        return NextResponse.redirect(new URL("/fallback-login.html?error=" + encodeURIComponent(err.message || "An unexpected error occurred."), req.url), 303);
    }
}
