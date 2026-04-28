"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DataDustLoader from "@/components/ui/DataDustLoader";
import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import { useUser } from "@/context/UserContext";

export default function RoadmapGenerate() {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
    const hasStarted = useRef(false);

    useEffect(() => {
        const generate = async () => {
            if (hasStarted.current) return;
            const paramsStr = sessionStorage.getItem("generateParams");
            if (!paramsStr) {
                router.push("/create");
                return;
            }
            hasStarted.current = true;
            const params = JSON.parse(paramsStr);
            sessionStorage.removeItem("generateParams");

            try {
                const response = await fetch("/api/generate/roadmap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        title: params.content?.substring(0, 50) || "Study Roadmap", 
                        context: params.content 
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    if (response.status === 402 || errorData.code === "INSUFFICIENT_CREDITS") {
                        setIsEndowmentOpen(true);
                        return;
                    }
                    throw new Error(errorData.error || "Generation failed");
                }

                const data = await response.json();
                if (data.roadmap?.id) {
                    refreshUser();
                    router.replace(`/roadmap/${data.roadmap.id}`);
                } else {
                    throw new Error("Generation completed but no ID returned");
                }

            } catch (err: any) {
                addToast(err.message, "error");
                router.push("/create");
            }
        };

        generate();
    }, [router, addToast, refreshUser]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
            <DataDustLoader />
            <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] opacity-50 animate-pulse">
                The Professor is architecting your syllabus...
            </p>

            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => router.push("/create")}
                currentCredits={user?.credits || 0}
                requiredCredits={1}
            />
        </div>
    );
}
