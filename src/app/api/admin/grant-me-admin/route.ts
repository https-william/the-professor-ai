import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    // Only allow this in development for safety, or if it's explicitly needed locally
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Forbidden in production" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", user.id);
        
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
