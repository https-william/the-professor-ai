"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToasts } from "@/components/ui/GlobalToasts";
import { Sparkles, AlertCircle, ArrowLeft, Database, Check, ShieldCheck, ChevronRight, HelpCircle } from "lucide-react";

// Nigerian Scholar Plans
const SUBSCRIPTIONS = [
    { 
        id: "free", 
        name: "Free Scholar", 
        credits: 100, 
        price: 0, 
        label: "₦0", 
        color: "var(--foreground-muted)",
        popular: false,
        badge: "Basic Prep",
        description: "For casual study. Basic notes deconstruction with standard speed & sequential queue delays.",
        perks: [
            "100 Starter Credits (one-off)",
            "50 Credits/mo Auto-Refill",
            "Standard Generation (with line queue)",
            "Max 10MB Document Uploads",
            "In-App Study Guides Only"
        ] 
    },
    { 
        id: "plus", 
        name: "Plus Scholar", 
        credits: 1000, 
        price: 1499, 
        label: "₦1,499/mo", 
        color: "var(--accent)",
        popular: true, 
        badge: "The Sweet Spot",
        description: "Perfect balance. Enough credits for 1,000 flashcards, 500 quizzes & exports to study offline when power is out or data is low.",
        perks: [
            "1,000 Credits Monthly Refill",
            "2x Faster Generation (No Queue)",
            "Max 25MB Uploads (150 pages)",
            "PDF, DOCX & CSV Exports",
            "Detailed Study Analytics",
            "Priority Study Support"
        ] 
    },
    { 
        id: "unlimited", 
        name: "Unlimited Professor", 
        credits: 999999, 
        price: 3499, 
        label: "₦3,499/mo", 
        color: "var(--foreground)",
        popular: false, 
        badge: "Uncapped Brainpower",
        description: "For heavy academic workloads (Medicine, Law, Engineering). Ingest textbooks & record whole lectures with zero credit limits.",
        perks: [
            "Infinite Scholar Credits (No limits)",
            "Maximum Speed AI Pipelines",
            "Max 100MB Uploads (Textbooks/Audio)",
            "PDF, DOCX & CSV Exports",
            "Advanced Learning Curves + XP",
            "24/7 VIP Support Channel"
        ] 
    },
];

// Micro Credit Top-Up Packages
const MICRO_TOPUPS = [
    { id: "topup_200", name: "Pepsi Fuel Pack", credits: 200, price: 200, label: "₦200", valueProp: "➔ ~200 Flashcards / 100 Quiz Qs", desc: "Price of a cold Pepsi. Emergency study fuel for a fast review session." },
    { id: "topup_500", name: "Midterm Cram", credits: 500, price: 500, label: "₦500", valueProp: "➔ ~500 Flashcards / 250 Quiz Qs", desc: "Perfect for single subject midterms. Parse a full syllabus handout." },
    { id: "topup_1000", name: "Exam Week Rescue", credits: 1200, price: 1000, label: "₦1,000", valueProp: "➔ ~1,200 Flashcards / 600 Quiz Qs", desc: "Lock in core concepts. Best value pack to digest multiple slide decks." },
    { id: "topup_2000", name: "Semester Anchor", credits: 2500, price: 2000, label: "₦2,000", valueProp: "➔ ~2,500 Flashcards / 1,250 Quiz Qs", desc: "Full semester coverage. Complete curriculum deconstruction without limits." }
];

// Peer Social Proof testimonials
const TESTIMONIALS = [
    { name: "Amaka", school: "Unilag", quote: "I used to skip sleep during midterms. Now I just drop my PPTs into The Professor, get my cards in 10s, and go to bed. ₦1,499/mo is cheaper than my data bundle." },
    { name: "Tunde", school: "ABU", quote: "The emergency ₦200 top-up saved me during exam week when I needed to ingest one last handbook. 10/10." },
    { name: "Bolu", school: "UI", quote: "Unlimited plan is a cheat code. Generating study guides for the entire class under 2 minutes." }
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

    // Handle Subscription Upgrades or Micro Top-ups
    const handlePayment = async (planId: string, price: number, credits: number, isSub: boolean) => {
        setIsLoading(planId);
        try {
            const res = await fetch("/api/paystack/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: price * 100, // in kobo
                    plan: planId, 
                    credits: credits 
                }),
            });

            const data = await res.json();

            if (!data.authorization_url) {
                throw new Error(data.error || "Failed to initialize payment");
            }

            // Lazy load Paystack Popup
            const PaystackPop = (await import("@paystack/inline-js")).default;
            const popup = new PaystackPop();
            const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
            
            if (!publicKey) {
                // Client env fallback redirect
                window.location.href = data.authorization_url;
                return;
            }

            // Define custom success messages per plan/top-up package
            const successMessages: Record<string, string> = {
                plus: "Endowment Confirmed! You are now a Plus Scholar. 1,000 monthly credits loaded, queues bypassed, and PDF exports unlocked. Let's get to work!",
                unlimited: "Welcome to the Faculty! You are now an Unlimited Professor. Credit limits are completely removed, maximum AI speeds activated, and 100MB uploads unlocked.",
                topup_200: "200 credits loaded! Pepsi Fuel Pack active. Keep the engine running.",
                topup_500: "500 credits loaded! Midterm Cram session pack active. Go ace it.",
                topup_1000: "1,200 credits loaded! Exam Week Rescue pack active. Lock in.",
                topup_2000: "2,500 credits loaded! Semester Anchor pack active. Complete curriculum coverage unlocked."
            };

            const successToast = successMessages[planId] || "Payment successful! Your account has been updated.";

            popup.resumeTransaction(data.reference, {
                onSuccess: async (transaction: any) => {
                    setIsProcessing(true);
                    addToast(successToast, 'success', 'account_balance', undefined, true);
                    
                    setTimeout(async () => {
                        await refreshUser();
                        await fetchHistory();
                        setIsProcessing(false);
                        setIsLoading(null);
                        // Redirect after success
                        window.location.href = "/dashboard";
                    }, 2500);
                },
                onCancel: () => {
                    setIsLoading(null);
                },
            } as any);

        } catch (error: any) {
            console.error("Payment Error:", error);
            addToast(error.message || "Payment Error. Please try again.", "error");
            setIsLoading(null);
        }
    };

    // Cancel Active Subscription
    const handleCancelSubscription = async () => {
        if (!confirm("Are you sure you want to cancel your active plan? You will immediately lose priority AI speeds, file export permissions, and your recurring credit refills.")) return;
        setIsProcessing(true);
        try {
            const res = await fetch("/api/paystack/cancel", {
                method: "POST"
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast("Subscription successfully canceled.", "success");
                await refreshUser();
                await fetchHistory();
            } else {
                throw new Error(data.error || "Cancellation failed");
            }
        } catch (error: any) {
            console.error("Cancel Error:", error);
            addToast(error.message || "Could not cancel subscription. Please contact support.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Calculate Credit Status Meter details
    const isUnlimited = user.planStatus === 'unlimited';
    const creditsValue = user.credits;
    let creditStatusText = "Fuel tank full. Ready for study marathons. 🚀";
    let creditColor = "bg-[var(--accent)]";
    let creditPercent = 100;

    if (!isUnlimited) {
        if (creditsValue <= 50) {
            creditStatusText = "Fuel critical. Cram season alert: Don't run dry! ⚠️";
            creditColor = "bg-amber-500 animate-pulse";
            creditPercent = Math.min(100, Math.max(8, (creditsValue / 100) * 100));
        } else if (creditsValue <= 200) {
            creditStatusText = "Fuel levels decreasing. Midterms ahead? ⚡";
            creditColor = "bg-amber-400";
            creditPercent = Math.min(100, (creditsValue / 500) * 100);
        } else {
            creditPercent = Math.min(100, (creditsValue / 1000) * 100);
        }
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 font-sans selection:bg-[var(--accent)]/30">
            {/* Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                    >
                        <div className="p-12 rounded-[32px] flex flex-col items-center gap-6 bg-[var(--card)] border border-[var(--card-border)] shadow-2xl">
                            <div className="w-12 h-12 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
                            <div className="text-center">
                                <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Verifying Treasury</h3>
                                <p className="text-xs text-[var(--foreground-muted)] mt-1">Refueling your study reserves...</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-5xl mx-auto px-6 pt-28 pb-12">
                {/* Clean Back Navigation Link under the Global Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <button 
                        onClick={() => window.history.back()} 
                        className="flex items-center gap-2 text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors group cursor-pointer bg-transparent border-none"
                    >
                        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                        Back to Settings
                    </button>
                    
                    <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-xs font-bold shadow-sm">
                        <Database size={13} className="text-[var(--accent)] animate-pulse" />
                        <span>Reserves: <strong className="text-[var(--foreground)] font-black">{isUnlimited ? "∞" : user.credits}</strong></span>
                    </div>
                </div>
                {/* Hero Balance Section */}
                <section className="relative mb-12 rounded-[32px] p-8 sm:p-12 overflow-hidden bg-[var(--card)] border border-[var(--card-border)] shadow-xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent)]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] mb-3 block">Institutional Reserves</span>
                            <h2 className="text-5xl sm:text-6xl font-black text-[var(--foreground)] tracking-tighter flex items-baseline gap-3">
                                {isUnlimited ? "Unlimited" : user.credits}
                                <span className="text-lg font-bold text-[var(--foreground-muted)] tracking-normal">Scholar Credits</span>
                            </h2>
                            <div className="mt-2 text-xs font-bold text-[var(--foreground-muted)]">
                                Current Tier: <span className="text-[var(--foreground)] capitalize font-black">{user.planStatus} Scholar</span>
                                {user.subscriptionEndDate && (
                                    <span className="text-[10px] text-white/30 ml-2">
                                        • Renews: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Interactive Fuel Meter */}
                        <div className="w-full md:w-80 p-5 rounded-2xl bg-black/20 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Credit Fuel Tank</span>
                                <span className="text-[9px] font-mono font-bold text-[var(--accent)]">
                                    {isUnlimited ? "Uncapped" : `${creditsValue} units`}
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${creditColor}`} 
                                    style={{ width: `${isUnlimited ? 100 : creditPercent}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-white/50 mt-2 font-mono">{creditStatusText}</p>
                        </div>
                    </div>
                </section>

                {/* The Asymmetric Decoy Nudge Banner */}
                <section className="mb-12 p-5 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
                        <Sparkles size={14} className="text-[var(--accent)]" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)]">Pro Hack: The Decoy Mathematics</h4>
                        <p className="text-[10px] text-[var(--foreground-muted)] mt-1 leading-relaxed">
                            Buying our <strong>₦2,000</strong> one-time top-up grants you 2,500 credits once. But subscribing to <strong>Plus Scholar for just ₦1,499/mo</strong> refills your tank with 1,000 credits <em>every month</em>, cuts your AI generation queues in half, and unlocks PDF downloads. Subscribing is the actual cheat code.
                        </p>
                    </div>
                </section>

                {/* Subscription Plans Section */}
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Membership Programs</h3>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {SUBSCRIPTIONS.map((plan) => {
                        const isActive = user.planStatus === plan.id;
                        const isFree = plan.id === "free";
                        
                        return (
                            <motion.div
                                key={plan.id}
                                whileHover={{ y: -6 }}
                                className={`group relative p-6 sm:p-8 rounded-3xl transition-all border flex flex-col bg-[var(--card)] ${
                                    isActive 
                                    ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/20 shadow-lg shadow-[var(--accent)]/5" 
                                    : "border-[var(--card-border)]"
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[var(--accent)] text-[var(--background)] text-[9px] font-black rounded-full uppercase tracking-widest shadow-md">
                                        {plan.badge}
                                    </div>
                                )}
                                
                                <div className="mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">{plan.name}</h4>
                                        {isActive && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-[8px] font-black uppercase tracking-widest">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-[var(--foreground)]">{plan.label}</span>
                                    </div>
                                    <p className="text-[10.5px] text-white/45 mt-3 leading-relaxed font-sans">{plan.description}</p>
                                </div>

                                <ul className="space-y-3.5 mb-8 flex-1">
                                    {plan.perks.map((perk) => (
                                        <li key={perk} className="flex items-start gap-2.5">
                                            <Check size={12} className="mt-0.5 shrink-0" style={{ color: isActive ? "var(--accent)" : "white", opacity: isActive ? 1 : 0.3 }} />
                                            <span className="text-[11px] text-white/50 leading-snug group-hover:text-white/70 transition-colors">{perk}</span>
                                        </li>
                                    ))}
                                </ul>

                                {isActive ? (
                                    !isFree ? (
                                        <button
                                            onClick={handleCancelSubscription}
                                            className="w-full py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
                                        >
                                            Cancel Subscription
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                                        >
                                            Currently Active
                                        </button>
                                    )
                                ) : (
                                    <button
                                        onClick={() => isFree ? addToast("You are already on the Free tier.", "info") : handlePayment(plan.id, plan.price, plan.credits, true)}
                                        disabled={!!isLoading}
                                        className={`w-full py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                            plan.popular 
                                            ? "bg-[var(--accent)] text-[var(--background)] hover:shadow-md hover:bg-amber-400" 
                                            : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                                        }`}
                                    >
                                        {isLoading === plan.id ? (
                                            <span className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
                                        ) : (
                                            isFree ? "Free Account" : "Subscribe Now"
                                        )}
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Micro Top-Ups Grid Section */}
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Emergency Micro Top-ups</h3>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {MICRO_TOPUPS.map((topup) => (
                        <div 
                            key={topup.id}
                            className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/[0.02] transition-all flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-white/30">{topup.name}</span>
                                    <span className="px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[9px] font-black text-[var(--accent)] border border-[var(--accent)]/20 font-mono">
                                        +{topup.credits} Units
                                    </span>
                                </div>
                                <h4 className="text-3xl font-black text-[var(--foreground)] tracking-tight">{topup.label}</h4>
                                <p className="text-[10px] text-[var(--accent)] font-bold mt-2 font-mono">{topup.valueProp}</p>
                                <p className="text-[10.5px] text-white/40 mt-3 leading-relaxed font-sans">{topup.desc}</p>
                            </div>
                            
                            <button
                                onClick={() => handlePayment(topup.id, topup.price, topup.credits, false)}
                                disabled={!!isLoading}
                                className="w-full mt-5 py-3 rounded-xl bg-white/5 group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)] text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {isLoading === topup.id ? (
                                    <span className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                                ) : (
                                    <>Buy Fuel <ChevronRight size={12} /></>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Testimonials Ticker */}
                <section className="mb-16 rounded-3xl p-8 bg-black/20 border border-[var(--card-border)]">
                    <div className="text-center mb-6">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">Voices from the Campus</span>
                        <h3 className="text-lg font-bold text-[var(--foreground)] uppercase mt-1">Nigeria's Scholars Speak</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, idx) => (
                            <div key={idx} className="p-5 rounded-2xl bg-[var(--card)] border border-white/5 flex flex-col justify-between">
                                <p className="text-[11px] text-white/50 leading-relaxed font-serif italic">"{t.quote}"</p>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-black uppercase text-[var(--accent)]">{t.name[0]}</div>
                                    <div className="text-[9px]">
                                        <span className="font-bold text-white/70 block">{t.name}</span>
                                        <span className="text-white/30 uppercase tracking-widest">{t.school}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* History Record */}
                {history.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Endowment Record</h3>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                            <div className="divide-y divide-white/5">
                                {history.map((h) => (
                                    <div key={h.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 ${h.status === 'success' ? 'text-[var(--accent)]' : 'text-amber-500'}`}>
                                                <Database size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-white/80">{h.credits > 900000 ? "Unlimited Plan" : `${h.credits} Credits`} Purchase</p>
                                                <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono">
                                                    {new Date(h.created_at).toLocaleDateString()} • {h.reference.slice(0, 12)}...
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
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

                {/* Footer Trust Details */}
                <div className="text-center py-6 border-t border-white/5">
                    <div className="flex items-center justify-center gap-2 text-white/30 mb-2">
                        <ShieldCheck size={14} />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">SECURE PAYMENTS POWERED BY PAYSTACK</span>
                    </div>
                    <p className="text-[8px] text-white/20 tracking-wider">END-TO-END ENCRYPTED TRANSACTIONS • 256-BIT SECURITY</p>
                </div>
            </main>
        </div>
    );
}
