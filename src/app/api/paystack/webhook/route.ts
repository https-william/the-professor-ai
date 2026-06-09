export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

// Webhook verification requires nodejs for crypto
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
        console.log(`[Paystack Webhook] Received event: ${event.event}`);

        // ── 1. CHARGE SUCCESS (One-time top-ups & subscriptions) ──
        if (event.event === "charge.success") {
            const { reference, metadata, amount, customer, subscription } = event.data;
            const userId = metadata?.user_id;

            if (!userId) {
                console.error("Webhook: No user_id in metadata");
                return NextResponse.json({ error: "No user_id" }, { status: 400 });
            }

            // Check if this payment was already processed
            const { data: existingPayment } = await supabaseAdmin
                .from("payments")
                .select("status")
                .eq("reference", reference)
                .single();

            if (existingPayment?.status === 'success') {
                console.log(`⚠️ Webhook: Reference ${reference} already processed. Skipping.`);
                return NextResponse.json({ status: "already_processed" });
            }

            const planId = metadata?.plan; // 'plus', 'unlimited', or 'topup'
            let creditsToAdd = Number(metadata?.credits || 0);

            // Log or update the payment record to successful
            const { error: dbPaymentError } = await supabaseAdmin
                .from("payments")
                .upsert({
                    reference: reference,
                    user_id: userId,
                    amount: amount,
                    credits: creditsToAdd,
                    status: 'success',
                    metadata: metadata
                });

            if (dbPaymentError) {
                console.error("Webhook Payment log/update failed:", dbPaymentError);
            }

            // Fetch current profile to calculate updates
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("credits, plan_status, paystack_customer_code, paystack_subscription_code")
                .eq("id", userId)
                .single();

            if (!profile) {
                return NextResponse.json({ error: "Profile not found" }, { status: 404 });
            }

            const profileUpdates: any = {};

            if (planId === "plus" || planId === "unlimited" || planId === "sprint_pass") {
                // Subscription activation / replenishment
                profileUpdates.plan_status = planId;
                profileUpdates.paystack_customer_code = customer?.customer_code || profile.paystack_customer_code;
                profileUpdates.paystack_subscription_code = subscription?.subscription_code || profile.paystack_subscription_code;
                
                // Calculate end date (default 30 days if not returned by Paystack)
                // If it is a weekly plan, default to 7 days
                const defaultDays = planId === "sprint_pass" ? 7 : 30;
                const nextPaymentDate = subscription?.next_payment_date 
                    ? new Date(subscription.next_payment_date)
                    : new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000);
                profileUpdates.subscription_end_date = nextPaymentDate.toISOString();

                // Credit allocation
                if (planId === "plus") {
                    // Plus Plan yields 1,000 monthly credits. 
                    // We can replenish up to 1,000 or append 1,000 credits to user balance.
                    // To be customer-friendly, let's append 1,000 credits!
                    profileUpdates.credits = (profile.credits || 0) + 1000;
                } else if (planId === "sprint_pass") {
                    // Sprint Pass yields 250 credits per week.
                    profileUpdates.credits = (profile.credits || 0) + 250;
                } else if (planId === "unlimited") {
                    // Unlimited tier has infinite credits. We set a high number for safety,
                    // but the guards will bypass checks automatically.
                    profileUpdates.credits = 999999;
                }
            } else {
                // One-time micro top-ups (₦200, ₦500, ₦1,000, ₦2,000)
                if (!creditsToAdd) {
                    // Fallback to kobo to credits mapping if not explicitly defined
                    creditsToAdd = Math.floor(amount / 100);
                }
                profileUpdates.credits = (profile.credits || 0) + creditsToAdd;
            }

            const { error: profileUpdateError } = await supabaseAdmin
                .from("profiles")
                .update(profileUpdates)
                .eq("id", userId);

            if (profileUpdateError) {
                console.error("Webhook Profile update failed:", profileUpdateError);
                return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
            }

            console.log(`✅ Webhook success: Updated user ${userId} to plan ${planId || 'free'} (Credits added/updated: ${creditsToAdd})`);
        }

        // ── 2. SUBSCRIPTION DISABLE / CANCELLATION ──
        if (event.event === "subscription.disable") {
            const { subscription_code, customer } = event.data;

            // Find profile with this subscription code
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("paystack_subscription_code", subscription_code)
                .single();

            if (profile) {
                const { error: cancelError } = await supabaseAdmin
                    .from("profiles")
                    .update({
                        plan_status: 'free',
                        paystack_subscription_code: null,
                        subscription_end_date: null
                    })
                    .eq("id", profile.id);

                if (cancelError) {
                    console.error(`[Webhook] Failed to cancel subscription for user ${profile.id}:`, cancelError);
                } else {
                    console.log(`[Webhook] Canceled/disabled subscription ${subscription_code} for user ${profile.id}`);
                }
            } else {
                console.warn(`[Webhook] Received subscription.disable but no matching user found for code ${subscription_code}`);
            }
        }

        // ── 3. INVOICE PAYMENT SUCCEEDED (Recurring renewals) ──
        if (event.event === "invoice.update" && event.data.status === "success") {
            const { subscription, customer, amount } = event.data;
            const subscriptionCode = subscription?.subscription_code;

            if (subscriptionCode) {
                const { data: profile } = await supabaseAdmin
                    .from("profiles")
                    .select("id, plan_status, credits")
                    .eq("paystack_subscription_code", subscriptionCode)
                    .single();

                if (profile) {
                    const profileUpdates: any = {};
                    
                    // Replenish credits on renewal
                    if (profile.plan_status === "plus") {
                        profileUpdates.credits = (profile.credits || 0) + 1000;
                    } else if (profile.plan_status === "sprint_pass") {
                        profileUpdates.credits = (profile.credits || 0) + 250;
                    }
                    
                    if (subscription?.next_payment_date) {
                        profileUpdates.subscription_end_date = new Date(subscription.next_payment_date).toISOString();
                    }

                    const { error: renewError } = await supabaseAdmin
                        .from("profiles")
                        .update(profileUpdates)
                        .eq("id", profile.id);

                    if (renewError) {
                        console.error(`[Webhook] Failed to process renewal for user ${profile.id}:`, renewError);
                    } else {
                        console.log(`[Webhook] Renewed subscription ${subscriptionCode} for user ${profile.id}. Balance refreshed.`);
                    }
                }
            }
        }

        return NextResponse.json({ status: "success" });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}
