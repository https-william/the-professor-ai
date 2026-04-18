"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DuelResults from "@/components/features/arena/DuelResults";
import SiteHeader from "@/components/ui/SiteHeader";

interface DuelData {
    id: string;
    status: string;
    isHost: boolean;
    winnerId: string | null;
    host: {
        id: string;
        name: string;
        avatar?: string;
        xp: number;
        score: number;
    };
    challenger: {
        id: string;
        name: string;
        avatar?: string;
        xp: number;
        score: number;
    } | null;
    generation: {
        id: string;
        title: string;
        questionCount: number;
        questions: any[];
    };
    timeLimit: number;
}

export default function ResultsClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const duelId = searchParams.get("id");
    
    const [duel, setDuel] = useState<DuelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDuel = async () => {
            if (!duelId) return;
            try {
                const res = await fetch(`/api/arena/${duelId}`);
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

        if (duelId) {
            fetchDuel();
        } else {
            router.push("/hub?s=arena");
        }
    }, [duelId, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#06060B] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !duel) {
        return (
            <div className="min-h-screen bg-[#06060B] flex flex-col items-center justify-center p-6">
                <h2 className="text-xl font-bold text-white/80 mb-2">Results Unavailable</h2>
                <p className="text-sm text-white/40 mb-6">{error || "Duel data not found."}</p>
                <button
                    onClick={() => router.push("/hub?s=arena")}
                    className="px-6 py-3 rounded-xl text-sm font-bold bg-white text-black"
                >
                    Back to Arena
                </button>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative">
            <SiteHeader showLogo />
            <div className="h-full overflow-y-auto pt-24">
                <DuelResults
                    duelId={duel.id}
                    isHost={duel.isHost}
                    winnerId={duel.winnerId}
                    host={duel.host}
                    challenger={duel.challenger}
                    questions={duel.generation?.questions || []}
                />
            </div>
        </div>
    );
}
