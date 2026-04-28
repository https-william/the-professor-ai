import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RoadmapViewer from "@/components/features/roadmap/RoadmapViewer";

interface RoadmapPageProps {
    params: Promise<{ id: string }>;
}

export default async function RoadmapIdPage({ params }: RoadmapPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: roadmap, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !roadmap) {
        notFound();
    }

    const phases = roadmap.content?.phases || roadmap.content || [];

    return (
        <div className="min-h-screen bg-[var(--background)]">
             <RoadmapViewer 
                phases={phases} 
                title={roadmap.title || "Academic Roadmap"} 
                generationId={roadmap.id}
            />
        </div>
    );
}
