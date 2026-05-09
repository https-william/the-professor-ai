"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, BrainCircuit, Share2, Sparkles, CheckCircle2 } from "lucide-react";
import StandardContainer from "@/components/ui/StandardContainer";
import { useToasts } from "@/components/ui/GlobalToasts";

export default function Eli5Viewer() {
    const router = useRouter();
    const { addToast } = useToasts();
    const [content, setContent] = useState<{ text: string, title: string } | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("lastEli5");
        if (!stored) {
            router.push("/create");
            return;
        }
        setContent(JSON.parse(stored));
    }, [router]);

    const handleCopy = () => {
        if (!content) return;
        navigator.clipboard.writeText(content.text);
        addToast("Analogy copied to clipboard", "success");
    };

    if (!content) return null;

    return (
        <div className="min-h-screen bg-[#fcfbf9] text-[var(--foreground)] py-24 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--blue-glow)] opacity-[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <StandardContainer>
                <div className="max-w-2xl mx-auto space-y-12">
                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => router.push('/create')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-[#1a1a1a] transition-all"
                        >
                            <ChevronLeft size={16} /> Return to Studio
                        </button>
                        <div className="flex items-center gap-3">
                            <button onClick={handleCopy} className="p-3 rounded-full bg-white border border-[var(--border)] shadow-sm hover:shadow-md transition-all">
                                <Share2 size={16} className="text-[var(--foreground-muted)]" />
                            </button>
                        </div>
                    </div>

                    {/* Analogy Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative p-12 sm:p-16 rounded-[48px] bg-white border border-[var(--border)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                            <BrainCircuit size={120} />
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--blue)]/5 flex items-center justify-center mb-10 border border-[var(--blue)]/10 shadow-inner">
                                <Sparkles className="text-[var(--blue)]" size={28} />
                            </div>
                            
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--blue)] mb-6">The Analogy</h2>
                            
                            <p className="text-2xl sm:text-3xl font-black text-[#1a1a1a] leading-tight tracking-tight mb-12 italic font-serif">
                                "{content.text}"
                            </p>
                            
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-[1px] w-12 bg-[var(--border)]" />
                                <p className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-60">
                                    Simplified for Cognitive Ease
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer Actions */}
                    <div className="flex flex-col items-center gap-6">
                        <button 
                            onClick={() => router.push('/create')}
                            className="group flex items-center gap-4 bg-[#1a1a1a] text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl"
                        >
                            <span>Initialize New Journey</span>
                            <CheckCircle2 size={18} className="text-[var(--blue)]" />
                        </button>
                        <p className="text-[10px] text-[var(--foreground-muted)] font-bold opacity-40 uppercase tracking-widest text-center">
                            Mastered by The Professor
                        </p>
                    </div>
                </div>
            </StandardContainer>
        </div>
    );
}
