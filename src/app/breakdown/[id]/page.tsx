import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BreakdownViewer from "@/components/features/breakdown/BreakdownViewer";

interface BreakdownPageProps {
    params: Promise<{ id: string }>;
}

export default async function BreakdownIdPage({ params }: BreakdownPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: breakdown, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !breakdown) {
        notFound();
    }

    const content = breakdown.content?.breakdown || breakdown.content?.data || "";

    return (
        <div className="min-h-screen bg-[var(--background)]">
             <BreakdownViewer 
                data={content} 
                title={breakdown.title || "Lecture Deconstruct"} 
                generationId={breakdown.id}
            />
        </div>
    );
}
