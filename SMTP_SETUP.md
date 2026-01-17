
# 📧 Supabase SMTP Configuration Guide (Gmail)

If automated emails (Verification, Magic Link) are not arriving or landing in spam, you need to configure **Custom SMTP** in Supabase.

**IMPORTANT:** Gmail requires strict security settings.

---

## 1. Get an App Password from Google

Standard Gmail passwords **DO NOT** work for SMTP. You must generate an App Password.

1.  Go to your **[Google Account Security Page](https://myaccount.google.com/security)**.
2.  Enable **2-Step Verification** (if not already enabled).
3.  Search for **"App passwords"** in the top search bar.
4.  Create a new App Password:
    *   **App Name**: `The Professor`
5.  **Copy the 16-character password** generated (e.g., `abcd efgh ijkl mnop`).

---

## 2. Configure Supabase Dashboard

1.  Go to your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2.  Select your project: **`the-professor`**.
3.  Navigate to **Authentication** -> **Configuration** (Sidebar) -> **SMTP Settings**.
4.  Toggle **Enable Custom SMTP** to **ON**.

### Fill in the fields EXACTLY as follows:

| Field | Value | Note |
| :--- | :--- | :--- |
| **Sender Email** | `vexis.automations@gmail.com` | Must match username. |
| **Sender Name** | `The Professor` | Display name in inbox. |
| **Host** | `smtp.gmail.com` | Google's SMTP server. |
| **Port** | `465` | **CRITICAL: Must be 465 for SSL.** |
| **Username** | `vexis.automations@gmail.com` | Full email address. |
| **Password** | `[YOUR_APP_PASSWORD]` | The 16-char code from Step 1 (No spaces). |

5.  Click **Save**.

---

## 3. Rate Limits (Fixing "Nothing Happens")

If you tested multiple times, Supabase blocked you.

1.  Go to **Authentication** -> **Configuration** -> **Rate Limits**.
2.  Set **Email OTP** to `10` / hour.
3.  Set **Sign ups** to `10` / hour.
4.  Click **Save**.

---

## 4. Verification

1.  Go to the app and sign up with a **NEW** email address (to avoid previous conflicts).
2.  Check the Inbox. The code should arrive instantly.
