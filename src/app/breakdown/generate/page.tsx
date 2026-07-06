"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DataDustLoader from "@/components/ui/DataDustLoader";
import ProfessorCeremony from "@/components/ui/ProfessorCeremony";
import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import { useUser } from "@/context/UserContext";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function BreakdownGenerate() {
    const router = useRouter();
    const { user } = useUser();
    const { addToast } = useToasts();
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
    const [status, setStatus] = useState("initializing");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        const generate = async () => {
            if (hasStarted.current) return;
            const paramsStr = sessionStorage.getItem("generateParams");
            
            if (!paramsStr) {
                router.push("/dashboard");
                return;
            }
            hasStarted.current = true;
            const params = JSON.parse(paramsStr);
            sessionStorage.removeItem("generateParams");

            try {
                const response = await fetch("/api/generate/breakdown", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(params),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    if (response.status === 402 || errorData.code === "INSUFFICIENT_CREDITS") {
                        setIsEndowmentOpen(true);
                        return;
                    }
                    throw new Error(errorData.error || "Generation failed");
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                if (!reader) throw new Error("No reader available");

                let lineBuffer = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    lineBuffer += decoder.decode(value, { stream: true });
                    let lines = lineBuffer.split("\n\n");
                    lineBuffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.status === "generating") {
                                    setStatus("generating");
                                    setProgress(prev => Math.min(prev + 5, 90));
                                } else if (data.type === "chunk") {
                                    setProgress(prev => Math.min(prev + 1, 95));
                                } else if (data.status === "complete") {
                                    setProgress(100);
                                    if (data.id) {
                                        router.replace(`/breakdown/${data.id}`);
                                    } else {
                                        throw new Error("Generation completed but no ID returned");
                                    }
                                } else if (data.status === "error") {
                                    throw new Error(data.error || "Streaming failed");
                                }
                            } catch (e) {}
                        }
                    }
                }

            } catch (err: any) {
                console.error("Breakdown Generate Error:", err);
                setError(err.message);
                setStatus("error");
            }
        };

        generate();
    }, [router, addToast]);

    if (status === "error") {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h2 className="text-xl font-black mb-2 uppercase tracking-tight">Generation Stalled</h2>
                <p className="text-sm text-[var(--foreground-muted)] max-w-xs mb-8 leading-relaxed">
                    The Professor encountered an unexpected error while deconstructing your notes. This usually happens with extremely complex files.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest hover-scale-md active:scale-[0.98] transition-all"
                    >
                        Try Refreshing
                    </button>
                    <button 
                        onClick={() => router.push("/dashboard")}
                        className="w-full py-4 rounded-2xl bg-white/5 text-white/40 font-black text-xs uppercase tracking-widest border border-white/10"
                    >
                        Return to Studio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center p-6 relative">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--blue)]/5 blur-[120px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-sm my-auto">
                <ProfessorCeremony />
                
                <div className="w-full bg-white/5 h-1 rounded-full mt-8 mb-4 overflow-hidden border border-white/5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    />
                </div>

                <div className="text-center">
                    <p className="text-[10px] font-mono font-black text-white/20">
                        {progress}% Complete
                    </p>
                </div>
            </div>

            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => router.push("/dashboard")}
                currentCredits={user?.credits || 0}
                requiredCredits={2}
            />
        </div>
    );
}
