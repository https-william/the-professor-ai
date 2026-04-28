"use client";

import { WifiOff } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8">
                <BrandLogo size="lg" />
            </div>
            
            <div className="w-20 h-20 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center mb-6">
                <WifiOff className="w-10 h-10 text-[var(--foreground-muted)]" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                You&apos;re Offline
            </h1>
            <p className="text-[var(--foreground-muted)] max-w-xs mb-8">
                It seems you&apos;ve lost your connection. Some features may be unavailable until you&apos;re back online.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-3 rounded-xl font-semibold bg-[var(--foreground)] text-[var(--background)] transition-transform active:scale-95"
                >
                    Try Again
                </button>
                
                <Link 
                    href="/dashboard"
                    className="w-full py-3 rounded-xl font-medium border border-[var(--border)] text-[var(--foreground)] transition-colors hover:bg-[var(--background-secondary)]"
                >
                    Go to Dashboard
                </Link>
            </div>

            <p className="mt-12 text-[11px] text-[var(--foreground-muted)] uppercase tracking-widest opacity-50">
                The Professor | AI Academy
            </p>
        </div>
    );
}
