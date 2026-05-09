"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DataDustLoader from "@/components/ui/DataDustLoader";
import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import { useUser } from "@/context/UserContext";

export default function MatchGenerate() {
    const router = useRouter();
    const { user } = useUser();
    const { addToast } = useToasts();
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
    const hasStarted = useRef(false);

    useEffect(() => {
        const start = async () => {
            if (hasStarted.current) return;
            const paramsStr = sessionStorage.getItem("generateParams");
            if (!paramsStr) {
                router.push("/create");
                return;
            }
            hasStarted.current = true;
            
            // Match handles its own generation in /match?mode=generate
            // We just need to make sure the params stay in session storage
            router.replace("/match?mode=generate");
        };

        start();
    }, [router]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
            <DataDustLoader />
            <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] opacity-50 animate-pulse">
                Preparing the Match Arena...
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
