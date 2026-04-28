import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SummaryViewer from "@/components/features/summary/SummaryViewer";

interface SummaryPageProps {
    params: Promise<{ id: string }>;
}

export default async function SummaryIdPage({ params }: SummaryPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: summary, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !summary) {
        notFound();
    }

    const content = summary.content?.summary || summary.content?.data || "";

    return (
        <div className="min-h-screen bg-[var(--background)]">
             <SummaryViewer 
                data={content} 
                title={summary.title || "Academic Summary"} 
                generationId={summary.id}
            />
        </div>
    );
}
