"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyOfflineVaultRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/library/offline");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent text-[var(--foreground)]">
            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Redirecting to Unified Offline Library...</p>
        </div>
    );
}
