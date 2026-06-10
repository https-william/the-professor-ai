"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { DuelResults } from "@/components/features/arena";
import { useUser } from "@/context/UserContext";
import { Loader2 } from "lucide-react";

function ResultsContent() {
    const searchParams = useSearchParams();
    const duelId = searchParams.get("id");
    const { user, refreshUser } = useUser();
    const [duel, setDuel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [xpAwarded, setXpAwarded] = useState(false);

    useEffect(() => {
        if (!duelId) return;

        const fetchDuel = async () => {
            try {
                const res = await fetch(`/api/arena/${duelId}`);
                const data = await res.json();
                if (data.success) {
                    setDuel(data.duel);
                } else {
                    setError(data.error || "Failed to load duel results.");
                }
            } catch (err) {
                console.error(err);
                setError("Network error loading duel results.");
            } finally {
                setLoading(false);
            }
        };

        fetchDuel();
    }, [duelId]);

    useEffect(() => {
        if (!duel || xpAwarded || !user?.id) return;

        const recordXp = async () => {
            const sessionKey = `duel-xp-awarded-${duel.id}`;
            if (sessionStorage.getItem(sessionKey)) {
                setXpAwarded(true);
                return;
            }

            const userId = user.id;
            const winnerId = duel.winnerId;
            const isWinner = winnerId === userId;
            const isDraw = winnerId === null && duel.host.score === (duel.challenger?.score || 0);
            const wagerXp = duel.wagerXp || 50;

            let xpGained = 0;
            if (isWinner) {
                xpGained = wagerXp;
            } else if (isDraw) {
                xpGained = 0;
            } else {
                xpGained = -wagerXp;
            }

            try {
                sessionStorage.setItem(sessionKey, "true");
                const res = await fetch("/api/user/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "trivia_duel", customXp: xpGained })
                });
                if (res.ok) {
                    setXpAwarded(true);
                    refreshUser();
                }
            } catch (err) {
                console.error("Failed to record duel XP:", err);
            }
        };

        if (duel.status === "COMPLETED") {
            recordXp();
        }
    }, [duel, xpAwarded, user, refreshUser]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-white w-10 h-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading Results...</p>
            </div>
        );
    }

    if (error || !duel) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
                <p className="text-sm font-bold text-red-400 mb-4 uppercase tracking-widest">{error || "Results not found"}</p>
                <a href="/arena" className="px-4 py-2 border border-white/10 rounded-lg text-xs font-black uppercase text-zinc-400 hover:text-white transition-colors">
                    Back to Arena
                </a>
            </div>
        );
    }

    const isHost = user?.id === duel.host.id;

    return (
        <DuelResults
            duelId={duel.id}
            isHost={isHost}
            winnerId={duel.winnerId}
            host={duel.host}
            challenger={duel.challenger}
            questions={duel.generation.questions}
        />
    );
}

export default function ArenaResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-white w-10 h-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading Results...</p>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
