"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import BrandLogo from "@/components/ui/BrandLogo";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center relative overflow-hidden px-6 transition-colors duration-500">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute w-[600px] h-[600px] top-[-10%] right-[-10%] rounded-full bg-[var(--accent)]/5 blur-[120px]" />
                <div className="absolute w-[500px] h-[500px] bottom-[-10%] left-[-10%] rounded-full bg-[var(--secondary)]/5 blur-[100px]" />
            </div>

            {/* Theme Toggle - Floating */}
            <ThemeToggle variant="floating" />

            {/* Content Wrapper */}
            <div className="text-center max-w-sm">
                <div className="mb-10 scale-125">
                    <BrandLogo size="lg" className="mx-auto" />
                </div>
                
                <h1 className="text-5xl font-black mb-6 tracking-tighter">
                    404
                </h1>
                
                <p className="text-[15px] text-[var(--foreground-muted)] mb-10 leading-relaxed italic font-serif">
                    "Errors are just unexpected lessons... but this page simply does not exist."
                    <br />
                    <span className="not-italic opacity-60">— The Professor</span>
                </p>

                <div className="space-y-4">
                    <Link 
                        href="/dashboard"
                        className="block w-full py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest transition-all hover-scale-md active:scale-[0.98] shadow-xl"
                    >
                        Return to Dashboard
                    </Link>
                    
                    <Link 
                        href="/"
                        className="block w-full py-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] font-bold text-xs uppercase tracking-widest transition-all hover:bg-[var(--background-tertiary)]"
                    >
                        Back to Campus
                    </Link>
                </div>
            </div>

            {/* Subtle Graphic */}
            <div className="mt-16 opacity-10">
                <span className="material-symbols-outlined text-[120px]">psychology</span>
            </div>
        </div>
    );
}
