"use client";

import React from "react";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import StandardContainer from "@/components/ui/StandardContainer";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

export default function BlogHeader() {
    const pathname = usePathname();
    const isPost = pathname.startsWith("/blog/");

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
            <StandardContainer narrow className="h-20 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <BrandLogo size="sm" />
                        <span className="font-heading font-black text-lg tracking-tighter text-[var(--foreground)] uppercase">
                            The Professor
                        </span>
                    </Link>

                    {!isPost && (
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/blog" className="text-[11px] font-black uppercase tracking-widest text-[var(--foreground)]">Insights</Link>
                            <Link href="/exams" className="text-[11px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Exam Guides</Link>
                            <Link href="/glossary" className="text-[11px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">Glossary</Link>
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {isPost && (
                        <Link 
                            href="/blog" 
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all"
                        >
                            <ArrowLeft size={14} /> Back to Blog
                        </Link>
                    )}
                    <ThemeToggle />
                    <Link 
                        href="/login" 
                        className="px-6 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        Sign In
                    </Link>
                </div>
            </StandardContainer>
        </header>
    );
}
