"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToasts } from "@/components/ui/GlobalToasts";
import { ArrowLeft, Database, ShieldCheck, Clock, Bell, Sparkles, Check, ChevronRight } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function BillingPage() {
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleStartTrial = async () => {
        setIsLoading(true);
        try {
            // Plus Scholar Plan Details: ₦1,499/mo
            const res = await fetch("/api/paystack/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: 1499 * 100, // ₦1,499 in kobo
                    plan: "plus", 
                    credits: 1000 
                }),
            });

            const data = await res.json();

            if (!data.authorization_url) {
                throw new Error(data.error || "Failed to initialize subscription");
            }

            // Lazy load Paystack Popup
            const PaystackPop = (await import("@paystack/inline-js")).default;
            const popup = new PaystackPop();
            const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
            
            if (!publicKey) {
                window.location.href = data.authorization_url;
                return;
            }

            popup.resumeTransaction(data.reference, {
                onSuccess: async () => {
                    setIsProcessing(true);
                    addToast("Trial initiated! Plus Scholar features unlocked. Let's get to work!", 'success', 'sparkles', undefined, true);
                    
                    setTimeout(async () => {
                        await refreshUser();
                        setIsProcessing(false);
                        setIsLoading(false);
                        window.location.href = "/dashboard";
                    }, 2500);
                },
                onCancel: () => {
                    setIsLoading(false);
                },
            } as any);

        } catch (error: any) {
            console.error("Payment Error:", error);
            addToast(error.message || "Could not start trial. Please try again.", "error");
            setIsLoading(false);
        }
    };

    if (!isMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[var(--blue)] border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    const isUnlimited = user.planStatus === 'unlimited';

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-[var(--blue)]/30 overflow-x-hidden">
            {/* Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                    >
                        <div className="p-12 rounded-[32px] flex flex-col items-center gap-6 bg-[var(--card)] border border-[var(--border)] shadow-2xl">
                            <div className="w-12 h-12 rounded-full border-2 border-[var(--blue)]/20 border-t-[var(--blue)] animate-spin" />
                            <div className="text-center">
                                <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Activating Lab</h3>
                                <p className="text-xs text-[var(--foreground-muted)] mt-1">Refueling your study reserves...</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12">
                {/* LEFT SIDE: Active Study Pack Preview Panel */}
                <section className="lg:col-span-6 relative bg-zinc-950/80 border-r border-[var(--border)] overflow-hidden hidden lg:flex flex-col justify-between p-12">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--blue)]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
                    <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[var(--blue)]/5 rounded-full blur-[120px] pointer-events-none" />
                    
                    {/* Header bar */}
                    <div className="flex items-center justify-between relative z-10">
                        <button 
                            onClick={() => window.history.back()} 
                            className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors group bg-transparent border-none cursor-pointer"
                        >
                            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                            Settings
                        </button>
                        <ThemeToggle />
                    </div>

                    {/* High-fidelity Mockup */}
                    <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-md mx-auto">
                        <div className="w-full p-8 rounded-[2.5rem] bg-[var(--card)]/60 backdrop-blur-xl border border-[var(--border)] shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--blue)] via-teal-500 to-[var(--blue)]" />
                            
                            {/* Study Guide Mockup Title */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="px-3 py-1 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/30 text-[var(--blue)] text-[9px] font-black uppercase tracking-widest">
                                    Study Pack Active
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Phase 01</span>
                            </div>
                            
                            <h3 className="text-xl font-black italic uppercase tracking-tight text-[var(--foreground)] mb-2">
                                Cardiovascular Pathologies
                            </h3>
                            <p className="text-xs text-[var(--foreground-muted)] font-medium leading-relaxed mb-6">
                                The Professor's distilled breakdown of high-yield exam topics. Just the parts that keep you out of trouble.
                            </p>

                            {/* Bullet Preview */}
                            <div className="space-y-3 mb-8">
                                <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[var(--blue)]/20 border border-[var(--blue)]/40 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={10} className="text-[var(--blue)]" />
                                    </div>
                                    <p className="text-xs text-white/70 leading-relaxed font-medium">
                                        <strong>Mitral Regurgitation:</strong> Systolic murmur radiating to the left axilla. High-yield association with infective endocarditis.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-[var(--blue)]/20 border border-[var(--blue)]/40 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={10} className="text-[var(--blue)]" />
                                    </div>
                                    <p className="text-xs text-white/70 leading-relaxed font-medium">
                                        <strong>Aortic Stenosis:</strong> Crescendo-decrescendo murmur. Classic triad of syncope, angina, and dyspnea on exertion.
                                    </p>
                                </div>
                            </div>

                            {/* Floating Mock Flashcard Stack */}
                            <div className="absolute -bottom-8 -right-8 w-64 p-5 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">Memory Card</span>
                                </div>
                                <h4 className="text-xs font-black text-white/80 leading-snug">
                                    What is the key clinical finding in Cardiac Tamponade?
                                </h4>
                                <div className="mt-4 pt-2 border-t border-white/5 flex justify-between items-center text-[8px] text-white/30 uppercase font-black">
                                    <span>Press space to flip</span>
                                    <ChevronRight size={10} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="text-xs font-bold text-[var(--foreground-muted)] relative z-10 flex items-center gap-2">
                        <Database size={12} className="text-[var(--blue)]" />
                        <span>Reserves: <strong className="text-[var(--foreground)]">{isUnlimited ? "∞" : user.credits}</strong> Scholar Credits</span>
                    </div>
                </section>

                {/* RIGHT SIDE: Transaction Logic & Timeline Module */}
                <section className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 relative">
                    <div className="max-w-md w-full mx-auto space-y-10">
                        
                        {/* Heading */}
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/20 text-[var(--blue)] text-[9px] font-black uppercase tracking-widest">
                                <Sparkles size={10} /> The Sweet Spot
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none italic uppercase">
                                Plus Scholar Plan
                            </h1>
                            <p className="text-sm text-[var(--foreground-muted)] font-medium leading-relaxed">
                                Get 1,000 monthly credits to ingest your lecture slides, build cards instantly, and download PDFs to study offline when power is out.
                            </p>
                        </div>

                        {/* Interactive Timeline Module */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)]">
                                How your free trial works
                            </h3>
                            
                            <div className="relative pl-6 border-l border-[var(--border)] space-y-8">
                                {/* Step 1 */}
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full bg-[var(--blue)] border-4 border-[var(--background)] ring-1 ring-[var(--blue)]/30" />
                                    <h4 className="text-xs font-black uppercase text-[var(--foreground)] mb-1">
                                        Today: Access Granted
                                    </h4>
                                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed font-medium">
                                        Instantly generate your first Study Pack from any textbook, PDF, or slide deck.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full bg-zinc-700 border-4 border-[var(--background)]" />
                                    <h4 className="text-xs font-black uppercase text-[var(--foreground)] mb-1">
                                        Day 5: Gentle Reminder
                                    </h4>
                                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed font-medium">
                                        We send you a subtle notification that your trial is wrapping up. No surprise charges.
                                    </p>
                                </div>

                                {/* Step 3 */}
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full bg-zinc-700 border-4 border-[var(--background)]" />
                                    <h4 className="text-xs font-black uppercase text-[var(--foreground)] mb-1">
                                        Day 7: Premium Access
                                    </h4>
                                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed font-medium">
                                        Plus Scholar begins at <strong>₦1,499/mo</strong>. Cancel anytime with a single click.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction CTA Block */}
                        <div className="space-y-4 pt-4">
                            <button
                                onClick={handleStartTrial}
                                disabled={isLoading}
                                className="w-full py-4 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10"
                            >
                                {isLoading ? (
                                    <span className="w-4 h-4 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                                ) : (
                                    "Start my free trial"
                                )}
                            </button>
                            
                            <div className="text-center space-y-1">
                                <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">
                                    Unlock full access in 2 clicks. No hidden setup.
                                </p>
                                <p className="text-[8px] text-white/20 tracking-wider">
                                    POWERED BY PAYSTACK • CANCEL ANYTIME IN SETTINGS
                                </p>
                            </div>
                        </div>

                        {/* Security Trust Badges */}
                        <div className="pt-6 border-t border-[var(--border)] flex items-center gap-3 text-white/30">
                            <ShieldCheck size={16} className="text-[var(--blue)] shrink-0" />
                            <p className="text-[9px] font-black uppercase tracking-widest leading-none">
                                End-to-End Encrypted Payments
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
