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

        const { amount, plan, credits } = await req.json(); // amount in kobo

        if (!amount) {
            return NextResponse.json({ error: "Amount required" }, { status: 400 });
        }

        // Map plan identifiers to Paystack plan codes
        const planCodes: Record<string, string | undefined> = {
            plus: process.env.PAYSTACK_PLAN_PLUS || "PLN_mock_plus_code",
            unlimited: process.env.PAYSTACK_PLAN_UNLIMITED || "PLN_mock_unlimited_code",
            sprint_pass: process.env.PAYSTACK_PLAN_SPRINT_PASS || "PLN_mock_sprint_pass_code"
        };

        // Initialize Paystack Transaction parameters
        const params: any = {
            email: user.email,
            amount: amount, // Amount in kobo
            callback_url: `${req.headers.get("origin")}/settings/billing`,
            metadata: {
                user_id: user.id,
                plan: plan || "topup",
                credits: credits || 0
            }
        };

        // If it is a subscription plan, inject the Paystack Plan Code
        if (plan === "plus" || plan === "unlimited" || plan === "sprint_pass") {
            params.plan = planCodes[plan];
        }

        const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });

        const data = await paystackRes.json();

        if (!data.status) {
            throw new Error(data.message || "Paystack initialization failed");
        }

        // Log the pending payment to our database for tracking
        const { error: dbError } = await supabaseAdmin.from("payments").insert({
            reference: data.data.reference,
            user_id: user.id,
            amount: amount,
            credits: credits || 0,
            status: 'pending',
            metadata: params.metadata
        });

        if (dbError) {
            console.error("Failed to log pending payment:", dbError);
            // We still proceed since Paystack initialized successfully
        }

        return NextResponse.json({ 
            authorization_url: data.data.authorization_url, 
            reference: data.data.reference 
        });

    } catch (error: any) {
        console.error("Paystack Init Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
