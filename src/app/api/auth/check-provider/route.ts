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

    // Initialize Supabase admin client using the service role key
    const authClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });

    try {
        let page = 1;
        let foundUser = null;

        // Query users through listUsers pagination (efficient for typical scales, completely bypasses restricted schema)
        while (true) {
            const { data: { users }, error } = await authClient.auth.admin.listUsers({
                page: page,
                perPage: 1000
            });

            if (error || !users || users.length === 0) {
                break;
            }

            const targetUser = users.find(u => u.email?.toLowerCase().trim() === email);
            if (targetUser) {
                foundUser = targetUser;
                break;
            }

            if (users.length < 1000) {
                break;
            }
            page++;
        }

        if (!foundUser) {
            return NextResponse.json({ exists: false });
        }

        const providers = foundUser.app_metadata?.providers || [];
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

