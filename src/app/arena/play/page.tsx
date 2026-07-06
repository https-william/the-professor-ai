"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { DuelPlay } from "@/components/features/arena";
import { useUser } from "@/context/UserContext";
import { Loader2 } from "lucide-react";

function PlayContent() {
    const searchParams = useSearchParams();
    const duelId = searchParams.get("id");
    const { user } = useUser();
    const [duel, setDuel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!duelId) return;

        const fetchDuel = async () => {
            try {
                const res = await fetch(`/api/arena/${duelId}`);
                const data = await res.json();
                if (data.success) {
                    setDuel(data.duel);
                } else {
                    setError(data.error || "Failed to load duel session.");
                }
            } catch (err) {
                console.error(err);
                setError("Network error loading duel.");
            } finally {
                setLoading(false);
            }
        };

        fetchDuel();
    }, [duelId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--foreground)]">
                <Loader2 className="animate-spin text-[var(--blue)] w-10 h-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Entering Study Duel...</p>
            </div>
        );
    }

    if (error || !duel) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--foreground)] p-4">
                <p className="text-sm font-bold text-red-500 mb-4 uppercase tracking-widest">{error || "Duel not found"}</p>
                <a href="/arena" className="px-5 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-xs font-black uppercase text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all shadow-sm">
                    Back to Arena
                </a>
            </div>
        );
    }

    const isHost = user?.id === duel.host.id;
    const opponent = isHost ? duel.challenger : duel.host;

    return (
        <DuelPlay
            duelId={duel.id}
            isHost={isHost}
            questions={duel.generation.questions}
            timeLimit={duel.timeLimit}
            opponent={opponent || { id: "", name: "Classmate" }}
        />
    );
}

export default function ArenaPlayPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--foreground)]">
                <Loader2 className="animate-spin text-[var(--blue)] w-10 h-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Entering Study Duel...</p>
            </div>
        }>
            <PlayContent />
        </Suspense>
    );
}
