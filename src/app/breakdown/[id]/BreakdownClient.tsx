"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BreakdownViewer from "@/components/features/breakdown/BreakdownViewer";

export default function BreakdownClient() {
    const params = useParams();
    const router = useRouter();
    const [breakdown, setBreakdown] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const id = params.id as string;

    useEffect(() => {
        if (!id || id === "placeholder") {
            setLoading(false);
            return;
        }

        const fetchBreakdown = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !data) {
                setError(error?.message || "Breakdown not found");
            } else {
                setBreakdown(data);
            }
            setLoading(false);
        };

        fetchBreakdown();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[var(--blue)] border-t-transparent animate-spin shadow-[0_0_30px_var(--blue-glow)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--foreground-muted)] animate-pulse">Loading Breakdown</span>
                </div>
            </div>
        );
    }

    if (error || !breakdown) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-center p-8 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] max-w-md">
                    <h3 className="text-lg font-black text-[var(--foreground)] mb-2 uppercase">Not Found</h3>
                    <p className="text-xs text-[var(--foreground-muted)] mb-6">This breakdown could not be found or loaded.</p>
                    <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Go to Dashboard</button>
                </div>
            </div>
        );
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
