
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export const runtime = 'nodejs'; // Webhook verification requires nodejs for crypto

export async function POST(req: NextRequest) {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY!;
        const signature = req.headers.get("x-paystack-signature");
        
        if (!signature) {
             return NextResponse.json({ error: "No signature" }, { status: 400 });
        }

        const body = await req.text();
        const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");

        if (hash !== signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(body);

        if (event.event === "charge.success") {
            const { reference, metadata, amount } = event.data;
            const userId = metadata?.user_id;

            if (!userId) {
                console.error("Webhook: No user_id in metadata");
                return NextResponse.json({ error: "No user_id" }, { status: 400 });
            }

            // --- 1. IDEMPOTENCY CHECK ---
            // Check if this transaction was already processed
            const { data: existingPayment } = await supabaseAdmin
                .from("payments")
                .select("status")
                .eq("reference", reference)
                .single();

            if (existingPayment?.status === 'success') {
                console.log(`⚠️ Webhook: Reference ${reference} already processed. Skipping.`);
                return NextResponse.json({ status: "already_processed" });
            }

            // --- 2. PLAN TO CREDITS MAPPING ---
            const PLAN_CREDITS: Record<string, number> = {
                "student": 500,
                "scholar": 1200,
                "professor": 3000
            };

            const planId = metadata?.plan;
            let creditsToAdd = metadata?.credits || 0;

            if (!creditsToAdd && planId && PLAN_CREDITS[planId]) {
                creditsToAdd = PLAN_CREDITS[planId];
            } else if (!creditsToAdd) {
                // Last resort fallback
                creditsToAdd = Math.floor(amount / 100);
            }

            // --- 3. DATABASE UPDATE ---
            // Update credits and payment status in a pseudo-transaction (non-atomic but robust with status check)
            
            // A. Fetch current profile
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("credits")
                .eq("id", userId)
                .single();

            const newCredits = (profile?.credits || 0) + creditsToAdd;

            // B. Update profiles & payments
            const [profileResult, paymentResult] = await Promise.all([
                supabaseAdmin.from("profiles").update({ credits: newCredits }).eq("id", userId),
                supabaseAdmin.from("payments").update({ status: 'success' }).eq("reference", reference)
            ]);

            if (profileResult.error || paymentResult.error) {
                console.error("Webhook DB Update Error:", { profile: profileResult.error, payment: paymentResult.error });
                return NextResponse.json({ error: "Database update failed" }, { status: 500 });
            }

            console.log(`✅ Webhook: Credited ${creditsToAdd} to user ${userId}. New balance: ${newCredits}`);
        }

        return NextResponse.json({ status: "success" });
    } catch (error: any) {
        console.error("Webhook Error:", error);
         return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}
