"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DataDustLoader from "@/components/ui/DataDustLoader";
import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import { useUser } from "@/context/UserContext";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Eli5Generate() {
    const router = useRouter();
    const { user } = useUser();
    const { addToast } = useToasts();
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
    const [status, setStatus] = useState("initializing");
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
                const response = await fetch("/api/generate/eli5", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: params.content }),
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

                let fullText = "";
                setStatus("generating");

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    fullText += decoder.decode(value, { stream: true });
                }

                // Store for the viewer
                sessionStorage.setItem("lastEli5", JSON.stringify({
                    text: fullText,
                    title: "Simplified Analogy"
                }));
                
                router.replace("/eli5");

            } catch (err: any) {
                console.error("ELI5 Generate Error:", err);
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
                <h2 className="text-xl font-black mb-2 uppercase tracking-tight">Simplification Failed</h2>
                <p className="text-sm text-[var(--foreground-muted)] max-w-xs mb-8 leading-relaxed">
                    The Professor couldn't find a simple enough analogy for this material. Try a shorter excerpt.
                </p>
                <button 
                    onClick={() => router.push("/dashboard")}
                    className="w-full max-w-xs py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest"
                >
                    Return to Studio
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center p-6 relative">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--blue)]/5 blur-[120px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-sm my-auto">
                <DataDustLoader />
                <div className="text-center mt-12">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] opacity-50 mb-2">
                        Finding a brilliant analogy...
                    </p>
                    <p className="text-[10px] font-mono font-black text-[var(--blue)] opacity-80">
                        Making it simple...
                    </p>
                </div>
            </div>

            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => router.push("/dashboard")}
                currentCredits={user?.credits || 0}
                requiredCredits={1}
            />
        </div>
    );
}
