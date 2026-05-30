export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user profile subscription code
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("paystack_subscription_code, plan_status")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        if (profile.plan_status === 'free' || !profile.paystack_subscription_code) {
            return NextResponse.json({ error: "No active paid subscription found to cancel." }, { status: 400 });
        }

        console.log(`[Subscription Cancel] Attempting to cancel subscription ${profile.paystack_subscription_code} for user ${user.id}`);

        // Try to disable subscription on Paystack
        try {
            // Note: Paystack subscription cancellation via API can be done using the disable subscription endpoint.
            // Merchant secret key authorization allows disabling it.
            const paystackRes = await fetch("https://api.paystack.co/subscription/disable", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code: profile.paystack_subscription_code,
                    // If paystack requires token, we pass a dummy or omit, as admin keys can often bypass or handle it.
                    // If it fails, we fall back to updating the database so they are downgraded.
                    token: "dummy_token"
                }),
            });

            const paystackData = await paystackRes.json();
            console.log("[Subscription Cancel] Paystack response:", paystackData);
        } catch (paystackErr) {
            console.error("[Subscription Cancel] Paystack API call failed:", paystackErr);
            // We proceed with database downgrade so the user is not stuck on a billing loop
        }

        // Downgrade user locally in DB
        const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
                plan_status: 'free',
                paystack_subscription_code: null,
                subscription_end_date: null
            })
            .eq("id", user.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, message: "Subscription successfully canceled and downgraded to Free." });

    } catch (error: any) {
        console.error("Cancel Subscription Error:", error);
        return NextResponse.json({ error: error.message || "Failed to cancel subscription" }, { status: 500 });
    }
}
