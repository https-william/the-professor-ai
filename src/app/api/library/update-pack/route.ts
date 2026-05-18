export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        const { packId, phasesData } = await req.json();

        if (!packId || !phasesData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { error: updateError } = await supabaseAdmin
            .from("study_packs")
            .update({ phases_data: phasesData })
            .eq("id", packId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Update Pack API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
