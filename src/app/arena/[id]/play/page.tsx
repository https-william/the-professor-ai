"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DuelPlay from "@/components/features/arena/DuelPlay";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface DuelData {
    id: string;
    status: string;
    isHost: boolean;
    host: {
        id: string;
        name: string;
        avatar?: string;
        xp?: number;
        score?: number;
    };
    challenger: {
        id: string;
        name: string;
        avatar?: string;
        xp?: number;
        score?: number;
    } | null;
    generation: {
        id: string;
        title: string;
        questionCount: number;
        questions: any[];
    };
    timeLimit: number;
}

export default function DuelPlayPage() {
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
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center transition-colors duration-500">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-[#EF4444] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/40">Entering the arena...</p>
                </div>
            </div>
        );
    }

    if (error || !duel || !duel.generation?.questions) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 transition-colors duration-500">
                <ThemeToggle variant="floating" />
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Unable to Start Duel</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-6">{error || "Questions not available"}</p>
                <button
                    onClick={() => router.push("/hub?s=arena")}
                    className="px-6 py-3 rounded-xl text-sm font-bold bg-white text-black"
                >
                    Back to Arena
                </button>
            </div>
        );
    }

    const opponent = duel.isHost ? duel.challenger : duel.host;

    if (!opponent) {
        useEffect(() => {
            const timer = setTimeout(() => router.push(`/arena/${params.id}`), 2000);
            return () => clearTimeout(timer);
        }, [router, params.id]);
        
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 transition-colors duration-500">
                <ThemeToggle variant="floating" />
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Waiting for Opponent...</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-6">Redirecting back to lobby</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] transition-colors duration-500 relative">
            <ThemeToggle variant="floating" />
            <DuelPlay
                duelId={duel.id}
                isHost={duel.isHost}
                questions={duel.generation.questions}
                timeLimit={duel.timeLimit}
                opponent={{
                    id: opponent.id,
                    name: opponent.name,
                    avatar: opponent.avatar
                }}
            />
        </div>
    );
}
