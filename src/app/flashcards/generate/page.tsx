"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DataDustLoader from "@/components/ui/DataDustLoader";
import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import { useUser } from "@/context/UserContext";

export default function FlashcardsGenerate() {
    const router = useRouter();
    const { user } = useUser();
    const { addToast } = useToasts();
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
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
                const response = await fetch("/api/generate/flashcards", {
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
                if (!reader) throw new Error("No stream content");

                let id = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");
                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;
                        try {
                            const json = JSON.parse(line.slice(6));
                            if (json.status === "complete" && json.id) {
                                id = json.id;
                            }
                        } catch (e) {}
                    }
                }

                if (id) {
                    router.replace(`/flashcards/${id}`);
                } else {
                    throw new Error("Generation completed but no ID returned");
                }

            } catch (err: any) {
                addToast(err.message, "error");
                router.push("/dashboard");
            }
        };

        generate();
    }, [router, addToast]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
            <DataDustLoader />
            <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] opacity-50 animate-pulse">
                The Professor is putting your study session together...
            </p>

            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => router.push("/dashboard")}
                currentCredits={user?.credits || 0}
                requiredCredits={1}
            />
        </div>
    );
}
