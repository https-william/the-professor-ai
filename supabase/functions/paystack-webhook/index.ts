
// Follows Supabase Edge Function Deno conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// Declare Deno global for TS check in environments without Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

console.log("Paystack Webhook Handler Online")

serve(async (req) => {
  try {
    // 1. Verify Request Method
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    // 2. Get Signature and Body
    const signature = req.headers.get("x-paystack-signature")
    const body = await req.text()
    
    // 3. Verify Signature (HMAC SHA512)
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY")
    if (!secret) {
      console.error("Missing PAYSTACK_SECRET_KEY")
      return new Response("Server Config Error", { status: 500 })
    }

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["verify", "sign"]
    )
    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      hexToUint8(signature || ""),
      encoder.encode(body)
    )

    if (!verified && !Deno.env.get("SKIP_SIGNATURE_CHECK")) {
      return new Response("Invalid Signature", { status: 401 })
    }

    // 4. Parse Event
    const event = JSON.parse(body)
    console.log(`Received Event: ${event.event}`)

    // 5. Initialize Admin Client (Bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 6. Handle 'charge.success'
    if (event.event === "charge.success") {
      const { customer, metadata, reference, amount, plan } = event.data
      const email = customer.email
      
      // Determine Tier from Metadata (Preferred) or Amount
      let tier = metadata?.tier
      let cycle = metadata?.billing_cycle || 'monthly'

      // Fallback inference if metadata missing
      if (!tier) {
        if (amount >= 800000) tier = 'Excellentia' // >80k kobo
        else if (amount >= 250000) tier = 'Scholar' // >2.5k kobo
        else tier = 'Fresher'
      }

      console.log(`Processing Upgrade: ${email} -> ${tier} (${cycle})`)

      // A. Find User
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !user) {
        console.error("User not found:", email)
        // Log orphan payment
        await supabase.from('payment_logs').insert({
          reference,
          amount: amount / 100,
          status: 'orphaned_user_not_found',
          plan_code: plan?.plan_code || 'one-time'
        })
        return new Response("User not found", { status: 200 }) // Return 200 to satisfy Paystack
      }

      // B. Update Subscription
      const renewsAt = new Date()
      if (cycle === 'annually') renewsAt.setFullYear(renewsAt.getFullYear() + 1)
      else renewsAt.setMonth(renewsAt.getMonth() + 1)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_status: 'active',
          billing_cycle: cycle,
          renews_at: renewsAt.toISOString(),
          paystack_customer_code: customer.customer_code
        })
        .eq('id', user.id)

      if (updateError) {
        console.error("Failed to update profile:", updateError)
        return new Response("Database Error", { status: 500 })
      }

      // C. Log Payment
      await supabase.from('payment_logs').insert({
        user_id: user.id,
        reference,
        amount: amount / 100,
        status: 'success',
        plan_code: plan?.plan_code || tier
      })

      console.log("Upgrade Successful")
    }
    
    // Handle Subscription Cancellations
    else if (event.event === "subscription.disable") {
        const email = event.data.customer.email;
        await supabase.from('profiles').update({ subscription_status: 'cancelled' }).eq('email', email);
    }

    return new Response("Webhook Processed", { status: 200 })

  } catch (err) {
    console.error(err)
    return new Response(`Error: ${err.message}`, { status: 400 })
  }
})

// Helper
function hexToUint8(hexString: string) {
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
}
