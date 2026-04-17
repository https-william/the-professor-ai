import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

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

        let query = supabase
            .from("generations")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (type) {
            query = query.eq("type", type);
        }

        const { data: generations, error: fetchError } = await query;

        if (fetchError) {
            console.error("Library fetch error:", fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, generations });
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
