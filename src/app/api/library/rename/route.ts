export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/library/rename
 * Renames a specific library item (study_pack or generation) owned by the authenticated user
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, newTitle } = await req.json();

        if (!id || !newTitle || typeof newTitle !== "string" || newTitle.trim() === "") {
            return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
        }

        const trimmedTitle = newTitle.trim();

        // 1. Try to update in study_packs table first (RLS allows owner to update)
        const { data: packData, error: packErr } = await supabase
            .from("study_packs")
            .update({ title: trimmedTitle })
            .eq("id", id)
            .eq("user_id", user.id)
            .select();

        if (packData && packData.length > 0) {
            return NextResponse.json({ success: true, table: "study_packs" });
        }

        // 2. Fallback to generations table.
        // Since generations doesn't have an UPDATE RLS policy, we select first to verify ownership,
        // then perform the update using supabaseAdmin.
        const { data: gen, error: selectErr } = await supabase
            .from("generations")
            .select("id")
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (selectErr) throw selectErr;

        if (gen) {
            const { error: updateErr } = await supabaseAdmin
                .from("generations")
                .update({ title: trimmedTitle })
                .eq("id", id);

            if (updateErr) throw updateErr;

            return NextResponse.json({ success: true, table: "generations" });
        }

        return NextResponse.json({ error: "Study material not found or unauthorized" }, { status: 404 });
    } catch (error: any) {
        console.error("Rename API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
