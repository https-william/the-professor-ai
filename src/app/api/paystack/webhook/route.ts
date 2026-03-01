
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
            const { metadata, amount } = event.data;
            const userId = metadata?.user_id;

            if (!userId) {
                console.error("Webhook: No user_id in metadata");
                return NextResponse.json({ error: "No user_id" }, { status: 400 });
            }

            // Plan-to-Credits Mapping
            const PLAN_CREDITS: Record<string, number> = {
                "student": 500,
                "scholar": 1200,
                "professor": 3000
            };

            const planId = metadata?.plan;
            let creditsToAdd = 0;

            if (planId && PLAN_CREDITS[planId]) {
                creditsToAdd = PLAN_CREDITS[planId];
            } else {
                // Fallback for simple top-ups: 100 kobo (1 NGN) = 1 Credit
                creditsToAdd = Math.floor(amount / 100);
            }

            // Use admin client to bypass RLS and update credits
            const supabase = createAdminClient();
            
            const { data: currentProfile, error: fetchError } = await supabase
                .from("profiles")
                .select("credits")
                .eq("id", userId)
                .single();

            if (fetchError) {
                console.error("Webhook: Failed to fetch profile", fetchError);
                return NextResponse.json({ error: "Profile fetch failed" }, { status: 500 });
            }

            const newCredits = (currentProfile.credits || 0) + creditsToAdd;

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ credits: newCredits })
                .eq("id", userId);

            if (updateError) {
                console.error("Webhook: Failed to update credits", updateError);
                return NextResponse.json({ error: "Credit update failed" }, { status: 500 });
            }

            console.log(`✅ Webhook: Credited ${creditsToAdd} to user ${userId}. New balance: ${newCredits}`);
        }

        return NextResponse.json({ status: "success" });
    } catch (error: any) {
        console.error("Webhook Error:", error);
         return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}
