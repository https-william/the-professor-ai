export const dynamic = 'force-dynamic';


import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { ids } = await request.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Missing or invalid IDs" }, { status: 400 });
        }

        // Apply RLS by ensuring user_id match
        const { error } = await supabase
            .from("generations")
            .delete()
            .in("id", ids)
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error: any) {
        console.error("Batch delete error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
