"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SummaryViewer from "@/components/features/summary/SummaryViewer";

export default function SummaryClient() {
    const params = useParams();
    const router = useRouter();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const id = params.id as string;

    useEffect(() => {
        if (!id || id === "placeholder") {
            setLoading(false);
            return;
        }

        const fetchSummary = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !data) {
                setError(error?.message || "Summary not found");
            } else {
                setSummary(data);
            }
            setLoading(false);
        };

        fetchSummary();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[var(--blue)] border-t-transparent animate-spin shadow-[0_0_30px_var(--blue-glow)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--foreground-muted)] animate-pulse">Loading Summary</span>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-center p-8 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] max-w-md">
                    <h3 className="text-lg font-black text-[var(--foreground)] mb-2 uppercase">Not Found</h3>
                    <p className="text-xs text-[var(--foreground-muted)] mb-6">This summary could not be found or loaded.</p>
                    <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Go to Dashboard</button>
                </div>
            </div>
        );
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
