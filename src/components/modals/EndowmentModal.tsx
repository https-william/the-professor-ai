"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Zap, ShieldAlert, Database, ArrowRight, History } from "lucide-react";

interface EndowmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiredCredits?: number;
    currentCredits?: number;
}

const plans = [
    { 
        id: "student", 
        name: "Student Stash", 
        credits: 500, 
        price: "₦500", 
        color: "#F59E0B"
    },
    { 
        id: "scholar", 
        name: "Scholar Stack", 
        credits: 1200, 
        price: "₦1,000", 
        color: "#10B981",
        popular: true
    },
    { 
        id: "professor", 
        name: "Professor's Grant", 
        credits: 3000, 
        price: "₦2,000", 
        color: "#818CF8"
    },
];

export default function EndowmentModal({ isOpen, onClose, requiredCredits = 1, currentCredits = 0 }: EndowmentModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-xl"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--card-border)] rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden"
                    style={{
                        boxShadow: "inset 0 1px 1px var(--accent-glow), 0 24px 64px rgba(0,0,0,0.2)"
                    }}
                >
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B]/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                    <div className="p-8 md:p-10">
                        {/* Header */}
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shadow-[0_8px_32px_rgba(245,158,11,0.15)] shrink-0">
                                <ShieldAlert className="w-7 h-7 text-[#F59E0B]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Insufficient Endowment</h2>
                                <p className="text-[13px] text-[var(--foreground-muted)] font-medium">Your current scholarly reserves are depleted.</p>
                            </div>
                        </div>

                        {/* Credits Display */}
                        <div className="flex items-center gap-4 p-5 rounded-3xl bg-[var(--background)] border border-[var(--border)] mb-10 shadow-inner">
                            <div className="flex-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] block mb-1">Available Units</span>
                                <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4 text-[#F59E0B]" />
                                    <span className="text-2xl font-black text-[var(--foreground)]">{currentCredits}</span>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-[var(--border)]" />
                            <div className="flex-1 pl-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] block mb-1">Required</span>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-[var(--foreground-muted)]" />
                                    <span className="text-2xl font-black text-[var(--foreground-muted)]">{requiredCredits}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Selection */}
                        <div className="space-y-4 mb-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-4">Request Top-Up</p>
                            <div className="grid grid-cols-1 gap-3">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        onClick={() => router.push('/settings/billing')}
                                        className="group relative flex items-center justify-between p-4 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--border-hover)] transition-all hover:-translate-y-0.5"
                                        style={{
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 1px var(--accent-glow)"
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${plan.color}15` }}>
                                                <Database className="w-5 h-5" style={{ color: plan.color }} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-sm font-bold text-[var(--foreground)]">{plan.name}</h4>
                                                <p className="text-[11px] text-[var(--foreground-muted)]">{plan.credits} Units • {plan.price}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => router.push('/settings/billing')}
                                className="w-full py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-extrabold text-[13px] uppercase tracking-widest shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Secure Funding
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-[11px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center justify-center gap-2 transition-colors"
                            >
                                <History className="w-4 h-4" />
                                Review Records
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
