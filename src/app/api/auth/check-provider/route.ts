export const dynamic = 'force-dynamic';

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Initialize Supabase client targeting the 'auth' schema using the service role key
    const authClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
        db: { schema: 'auth' }
    });

    try {
        const { data: user, error } = await authClient
            .from('users')
            .select('id, email, raw_app_meta_data')
            .eq('email', email)
            .maybeSingle();

        if (error || !user) {
            return NextResponse.json({ exists: false });
        }

        const providers = user.raw_app_meta_data?.providers || [];
        const isGoogleOnly = providers.includes("google") && !providers.includes("email");

        return NextResponse.json({
            exists: true,
            isGoogleOnly,
            providers
        });
    } catch (err: any) {
        console.error("Provider check error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
