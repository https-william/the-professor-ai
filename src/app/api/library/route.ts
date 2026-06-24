export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



/**
 * GET /api/library
 * Fetches all generations (flashcards, quizzes, etc.) for the authenticated user
 * Optional: ?type=quiz to filter by type
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        let genQuery = supabase
            .from("generations")
            .select("*")
            .eq("user_id", user.id);

        let packQuery = supabase
            .from("study_packs")
            .select("*")
            .eq("user_id", user.id);

        if (type) {
            genQuery = genQuery.eq("type", type);
            // Assuming study_packs might not use 'type' column identically, 
            // but we'll apply it if needed. If type is passed, perhaps it's specific.
        }

        const [genRes, packRes] = await Promise.all([
            genQuery,
            packQuery
        ]);

        if (genRes.error) {
            console.error("Generations fetch error:", genRes.error);
        }
        if (packRes.error) {
            console.error("Study Packs fetch error:", packRes.error);
        }

        const combined = [];
        if (genRes.data) combined.push(...genRes.data);
        if (packRes.data) {
            const packsAsItems = packRes.data.map((p: any) => ({
                id: p.id,
                title: p.title || "Untitled Study Pack",
                type: "exam_sprint",
                created_at: p.created_at,
                phases_data: p.phases_data,
                source_text: p.source_text
            }));
            combined.push(...packsAsItems);
        }

        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({ success: true, generations: combined });
    } catch (error: any) {
        console.error("Library GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/library?id=<generation_id>
 * Deletes a specific generation by ID
 */
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
        }

        // Delete (RLS ensures user can only delete their own)
        const { error: deleteError } = await supabase
            .from("generations")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("Library delete error:", deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Library DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
