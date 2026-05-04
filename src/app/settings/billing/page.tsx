"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToasts } from "@/components/ui/GlobalToasts";

const plans = [
    { 
        id: "student", 
        name: "Student Stash", 
        credits: 500, 
        price: 500, 
        label: "₦500", 
        color: "var(--accent)",
        perks: ["100 Flashcard Decks", "100 Quizzes", "Standard Support"] 
    },
    { 
        id: "scholar", 
        name: "Scholar Stack", 
        credits: 1200, 
        price: 1000, 
        label: "₦1,000", 
        popular: true, 
        color: "var(--success)",
        perks: ["240 Flashcard Decks", "240 Quizzes", "Best Value", "Faster Generation"] 
    },
    { 
        id: "professor", 
        name: "Professor's Grant", 
        credits: 3000, 
        price: 2000, 
        label: "₦2,000", 
        color: "var(--secondary)",
        perks: ["600 Flashcard Decks", "600 Quizzes", "Priority Processing", "Exclusive AI Models"] 
    },
];

export default function BillingPage() {
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchHistory();
    }, [user.id]);

    const fetchHistory = async () => {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);
        if (!error && data) setHistory(data);
    };

    const handleTopUp = async (plan: typeof plans[0]) => {
        setIsLoading(plan.id);
        try {
            const res = await fetch("/api/paystack/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: plan.price * 100, 
                    plan: plan.id, 
                    credits: plan.credits 
                }),
            });

            const data = await res.json();

            if (!data.authorization_url) {
                throw new Error(data.error || "Failed to initialize payment");
            }

            const PaystackPop = (await import("@paystack/inline-js")).default;
            const popup = new PaystackPop();
            
            // Fix: resumeTransaction no longer needs key parameter
            // If the user wants a popup, we ensure the public key is present.
            const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
            
            if (!publicKey) {
                // Fallback to direct redirect if public key is missing from client env
                window.location.href = data.authorization_url;
                return;
            }

            popup.resumeTransaction(data.reference, {
                onSuccess: async (transaction: any) => {
                    setIsProcessing(true);
                    addToast(`${plan.name} Endowment Confirmed!`, 'success', 'account_balance', undefined, true);
                    
                    // Poll for credit update or just wait a bit and refresh
                    setTimeout(async () => {
                        await refreshUser();
                        await fetchHistory();
                        setIsProcessing(false);
                        setIsLoading(null);
                    }, 2000);
                },
                onCancel: () => {
                    setIsLoading(null);
                },
            } as any);

        } catch (error: any) {
            console.error("Payment Error:", error);
            addToast(error.message || "Payment Error. Please try again.", "error");
        } finally {
            // Keep loading true if redirecting, otherwise false
            // setIsLoading(null); // Moved into success/cancel handlers
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 font-sans selection:bg-[var(--accent)]/30">
            {/* Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                    >
                        <div className="p-12 rounded-[40px] flex flex-col items-center gap-6 bg-[var(--card)] border border-[var(--card-border)] shadow-2xl">
                            <div className="w-16 h-16 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-[var(--foreground)]">Confirming Endowment</h3>
                                <p className="text-sm text-[var(--foreground-muted)] mt-1">Verifying your contribution with the treasury...</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--background-secondary)] border border-[var(--border)] transition-all group">
                        <span className="material-symbols-outlined text-xl text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-[var(--foreground)]">Financial Treasury</h1>
                        <p className="text-[9px] text-[var(--accent)] font-black uppercase tracking-[0.3em]">Endowment Office</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                    <span className="material-symbols-outlined text-[var(--accent)] text-sm">database</span>
                    <span className="text-xs font-black tracking-widest">{user.credits} <span className="text-[var(--foreground-muted)]">UNITS</span></span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Hero Balance */}
                <section className="relative mb-16 rounded-[48px] p-12 overflow-hidden bg-[var(--card)] border border-[var(--card-border)] shadow-xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent)]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] mb-4 block">Institutional Reserves</span>
                            <h2 className="text-7xl font-black text-[var(--foreground)] tracking-tighter flex items-baseline gap-4">
                                {user.credits}
                                <span className="text-2xl font-bold text-[var(--foreground-muted)] tracking-normal">Scholar Credits</span>
                            </h2>
                            <p className="mt-4 text-sm text-[var(--foreground-muted)] max-w-md">Your endowment allows for high-precision generation of flashcards, quizzes, and academic summaries.</p>
                        </div>
                        <div className="flex gap-2">
                             {[1,2,3].map(i => <div key={i} className="w-1 h-8 rounded-full bg-[var(--border)]" />)}
                        </div>
                    </div>
                </section>

                {/* Plans Grid */}
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Available Endowments</h3>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan.id}
                            whileHover={{ y: -8 }}
                            className={`group relative p-8 rounded-[40px] nm-flat transition-all border border-white/5 flex flex-col ${plan.popular ? 'ring-2 ring-emerald-500/20' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 bg-emerald-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest shadow-[0_8px_20px_rgba(16,185,129,0.3)]">
                                    Highly Recommended
                                </div>
                            )}
                            
                            <div className="mb-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: plan.color }}>{plan.name}</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-[var(--foreground)]">{plan.credits}</span>
                                    <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-[0.1em]">Units</span>
                                </div>
                                <div className="mt-4 inline-flex px-4 py-2 rounded-2xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                                    <span className="text-sm font-black text-[var(--foreground-secondary)]">{plan.label}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {plan.perks.map((perk) => (
                                    <li key={perk} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-[16px] mt-0.5" style={{ color: plan.color }}>verified</span>
                                        <span className="text-[12px] text-white/40 leading-snug group-hover:text-white/60 transition-colors">{perk}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleTopUp(plan)}
                                disabled={!!isLoading}
                                className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                                    plan.popular 
                                    ? "bg-[var(--success)] text-[var(--background)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.2)]" 
                                    : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] border border-[var(--border)]"
                                }`}
                            >
                                {isLoading === plan.id ? (
                                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                ) : (
                                    "Authorize"
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* History */}
                {history.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Endowment Record</h3>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="nm-inset rounded-[32px] overflow-hidden border border-white/5 bg-black/20">
                            <div className="divide-y divide-white/5">
                                {history.map((h) => (
                                    <div key={h.id} className="p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center nm-flat ${h.status === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                <span className="material-symbols-outlined text-xl">
                                                    {h.status === 'success' ? 'payments' : 'pending'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-white/80">{h.credits} Credit Endowment</p>
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest">{new Date(h.created_at).toLocaleDateString()} \u2022 {h.reference}</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            h.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                        }`}>
                                            {h.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Footer Trust */}
                <div className="text-center opacity-20 py-10">
                    <div className="inline-block px-12 py-1 bg-white/5 rounded-full mb-6" />
                    <p className="text-[9px] font-black uppercase tracking-[0.5em]">The Professor Integrity Network</p>
                    <p className="text-[8px] mt-2 tracking-[0.2em] font-medium">END-TO-END ENCRYPTED ENDOWMENTS 256-BIT</p>
                </div>
            </main>
        </div>
    );
}
