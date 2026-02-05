
# 💳 Paystack & Supabase Integration Guide

This guide ensures that when a student pays, their account is automatically upgraded.

## 1. Paystack Dashboard Configuration (Do this first)

You must create recurring plans so Paystack knows how much to charge.

1.  Log in to **Paystack Dashboard**.
2.  Go to **Plans**.
3.  Click **New Plan** and create the following 4 plans:

| Plan Name | Interval | Amount (NGN) |
| :--- | :--- | :--- |
| **Scholar Monthly** | Monthly | **2,900** |
| **Scholar Annual** | Annually | **29,000** |
| **Excellentia Monthly** | Monthly | **8,500** |
| **Excellentia Annual** | Annually | **85,000** |

4.  **Copy the Plan Codes** (e.g., `PLN_gx2...`).
5.  Add them to your `.env` file in the project root:

```env
VITE_PAYSTACK_PLAN_SCHOLAR_MONTHLY=PLN_your_code_here
VITE_PAYSTACK_PLAN_SCHOLAR_ANNUALLY=PLN_your_code_here
VITE_PAYSTACK_PLAN_EXCELLENTIA_MONTHLY=PLN_your_code_here
VITE_PAYSTACK_PLAN_EXCELLENTIA_ANNUALLY=PLN_your_code_here
```

## 2. Deploy the Edge Function

This code lives on the server and listens for successful payments.

### Prerequisites
*   Supabase CLI installed (`npm install -g supabase`)
*   Logged in to Supabase (`supabase login`)

### Deployment Command
Run this in your project terminal:

```bash
# 1. Link your project (get ref from Supabase Dashboard > Settings > General)
supabase link --project-ref your-project-ref

# 2. Deploy the function
supabase functions deploy paystack-webhook --no-verify-jwt
```

> **Note:** The `--no-verify-jwt` flag is CRITICAL. Paystack does not send a Supabase JWT. We verify the request using the signature header instead.

## 3. Set the Secret Key

The webhook needs your Paystack Secret Key to verify the transaction is genuine.

1.  Get `Secret Key` from Paystack Dashboard > Settings > API Keys.
2.  Run this command in your terminal:

```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxx
```

## 4. Connect Paystack to Supabase

1.  Go to **Paystack Dashboard** > **Settings** > **API Keys & Webhooks**.
2.  Scroll to **Webhook URL**.
3.  Enter your function URL:
    ```
    https://[YOUR_SUPABASE_REF].supabase.co/functions/v1/paystack-webhook
    ```
4.  Save Changes.

## 5. Testing the Flow

1.  **Frontend**: Open the app, go to Tuition, select a plan.
2.  **Payment**: Complete the transaction (use a Test Card if in Test Mode).
3.  **Verification**:
    *   Check Paystack Dashboard: Transaction should be "Success".
    *   Check Supabase Database: `payment_logs` table should have a new entry.
    *   Check Supabase Database: `profiles` table `subscription_tier` should be updated for your user.

## 6. Troubleshooting

*   **Signature Error**: Ensure `PAYSTACK_SECRET_KEY` in Supabase matches the one in Paystack exactly.
*   **User Not Found**: The email used for payment MUST match the email in the `profiles` table.
*   **Logs**: View function logs in Supabase Dashboard > Edge Functions > Logs.
