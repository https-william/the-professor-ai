
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount, plan } = await req.json(); // amount in kobo

        if (!amount) {
            return NextResponse.json({ error: "Amount required" }, { status: 400 });
        }

        // Initialize Paystack Transaction
        const params = {
            email: user.email,
            amount: amount, // Amount in kobo
            callback_url: `${req.headers.get("origin")}/settings/billing`,
            metadata: {
                user_id: user.id,
                plan: plan || "topup"
            }
        };

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

        return NextResponse.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });

    } catch (error: any) {
        console.error("Paystack Init Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
