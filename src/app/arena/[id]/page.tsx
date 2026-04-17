"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DuelLobby from "@/components/features/arena/DuelLobby";
import DuelPlay from "@/components/features/arena/DuelPlay";
import DuelResults from "@/components/features/arena/DuelResults";
import SiteHeader from "@/components/ui/SiteHeader";

interface DuelData {
    id: string;
    code: string;
    status: string;
    isHost: boolean;
    host: {
        id: string;
        name: string;
        avatar?: string;
        xp?: number;
        streak?: number;
        score?: number;
        session?: {
            currentQuestionIndex: number;
            isReady: boolean;
            answers: Record<string, number>;
        };
    };
    challenger: {
        id: string;
        name: string;
        avatar?: string;
        xp?: number;
        streak?: number;
        score?: number;
        session?: {
            currentQuestionIndex: number;
            isReady: boolean;
            answers: Record<string, number>;
        };
    } | null;
    generation: {
        id: string;
        title: string;
        questionCount: number;
        questions?: any[];
    };
    timeLimit: number;
    winnerId: string | null;
}

export default function ArenaPage() {
    const params = useParams();
    const router = useRouter();
    const [duel, setDuel] = useState<DuelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDuel = async () => {
            try {
                const res = await fetch(`/api/arena/${params.id}`);
                if (!res.ok) throw new Error("Duel not found");
                
                const data = await res.json();
                if (data.success) {
                    setDuel(data.duel);
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchDuel();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--error)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !duel) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--error-bg)", border: "1px solid var(--error-light)" }}>
                    <span className="material-symbols-outlined text-3xl text-[var(--error)]">error</span>
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Duel Not Found</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-6 text-center">{error || "This duel may have expired or been cancelled."}</p>
                <button
                    onClick={() => router.push("/hub?s=arena")}
                    className="px-6 py-3 rounded-xl text-sm font-bold bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-all"
                >
                    Back to Arena
                </button>
            </div>
        );
    }

    // Lobby state - waiting for opponent or ready to start
    if (duel.status === 'WAITING' || duel.status === 'READY') {
        return (
            <>
                <SiteHeader showLogo />
                <DuelLobby
                    duelId={duel.id}
                    code={duel.code}
                    status={duel.status}
                    isHost={duel.isHost}
                    host={duel.host}
                    challenger={duel.challenger}
                    generation={duel.generation}
                    timeLimit={duel.timeLimit}
                    onOpponentJoin={() => {
                        // Refresh duel data
                        fetch(`/api/arena/${params.id}`)
                            .then(res => res.json())
                            .then(data => {
                                if (data.success) setDuel(data.duel);
                            });
                    }}
                    onDuelStart={() => {
                        setDuel({ ...duel, status: 'IN_PROGRESS' });
                    }}
                    onDuelEnd={() => {
                        router.push(`/arena/${duel.id}/results`);
                    }}
                />
            </>
        );
    }

    // In progress - redirect to play page
    if (duel.status === 'IN_PROGRESS') {
        router.replace(`/arena/${duel.id}/play`);
        return null;
    }

    // Completed - redirect to results
    if (duel.status === 'COMPLETED') {
        router.replace(`/arena/${duel.id}/results`);
        return null;
    }

    // Fallback
    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <p className="text-[var(--foreground-muted)]">Loading...</p>
        </div>
    );
}
