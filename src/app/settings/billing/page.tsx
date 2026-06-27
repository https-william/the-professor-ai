"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToasts } from "@/components/ui/GlobalToasts";
import { ArrowLeft, Database, ShieldCheck, Clock, Bell, Sparkles, Check, ChevronRight, X, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { cn } from "@/lib/utils";

export default function BillingPage() {
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'sprint_pass' | 'plus' | 'unlimited'>('plus');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const supabase = createClient();
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const getAudioCtx = useCallback(() => {
        if (typeof window === "undefined") return null;
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    const playClickTick = useCallback(() => {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
    }, [getAudioCtx]);

    const playSelectSound = useCallback(() => {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.16);
    }, [getAudioCtx]);

    const handleStartTrial = async () => {
        playClickTick();
        setIsLoading(true);
        try {
            let amount = 1499 * 100;
            let credits = 1000;
            
            if (selectedPlan === 'sprint_pass') {
                amount = 399 * 100;
                credits = 250;
            } else if (selectedPlan === 'unlimited') {
                amount = 3999 * 100;
                credits = 999999;
            }
            
            const plan = selectedPlan;

            const res = await fetch("/api/paystack/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount,
                    plan, 
                    credits 
                }),
            });

            const data = await res.json();

            if (!data.authorization_url) {
                throw new Error(data.error || "Failed to initialize subscription");
            }

            // Lazy load Paystack Popup
            const PaystackPop = (await import("@paystack/inline-js")).default;
            const popup = new PaystackPop();
            const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.NEXT_PUBLIC_PAYSTACK_KEY;
            
            if (!publicKey) {
                window.location.href = data.authorization_url;
                return;
            }

            popup.resumeTransaction(data.reference, {
                onSuccess: async () => {
                    setIsProcessing(true);
                    const toastMessage = selectedPlan === 'sprint_pass' 
                        ? "Weekly Sprint Pass features unlocked." 
                        : selectedPlan === 'unlimited' 
                            ? "Unlimited Professor features unlocked!" 
                            : "Plus Scholar features unlocked.";
                    addToast(`Trial initiated! ${toastMessage} Let's get to work!`, 'success', 'sparkles', undefined, true);
                    
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

    const handleCancelSubscription = async () => {
        setIsCancelling(true);
        try {
            const res = await fetch("/api/paystack/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast("Subscription successfully cancelled. Your account has been downgraded to Free.", "success", "sparkles");
                await refreshUser();
                setShowCancelModal(false);
            } else {
                throw new Error(data.error || "Failed to cancel subscription");
            }
        } catch (error: any) {
            console.error("Cancellation error:", error);
            addToast(error.message || "Failed to cancel subscription. Please try again.", "error");
        } finally {
            setIsCancelling(false);
        }
    };

    if (!isMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    const isUnlimited = user.planStatus === 'unlimited';
    const planAccentColor = selectedPlan === 'sprint_pass' ? '#E5A93C' : selectedPlan === 'unlimited' ? '#2BB288' : '#9673F5';

    return (
        <div className="relative w-full text-white font-sans selection:bg-amber-500/20 bg-[#09090b]">
            {/* Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
                    >
                        <GlassmorphicCard intensity="heavy" className="p-12 rounded-[28px] flex flex-col items-center gap-6 border border-white/10 shadow-2xl">
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-[var(--accent)] animate-spin" />
                            <div className="text-center">
                                <h3 className="text-xs font-black uppercase tracking-wider font-mono">Calibrating Vault</h3>
                                <p className="text-[10px] text-white/50 mt-1 font-mono">Syncing credentials to cloud...</p>
                            </div>
                        </GlassmorphicCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
                {/* LEFT SIDE: Preview Panel */}
                <section className="lg:col-span-6 relative bg-zinc-950/80 border-r border-white/5 overflow-hidden hidden lg:flex flex-col justify-between p-12">
                    <div 
                        className="absolute inset-0 opacity-40 pointer-events-none transition-all duration-500" 
                        style={{
                            background: `radial-gradient(circle 350px at 0% 100%, ${planAccentColor}12, transparent 80%)`
                        }}
                    />
                    <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />
                    
                    {/* Header bar */}
                    <div className="flex items-center justify-between relative z-10">
                        <button 
                            onClick={() => {
                                playClickTick();
                                window.history.back();
                            }} 
                            className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors group bg-transparent border-none cursor-pointer"
                        >
                            <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-1" />
                            Settings
                        </button>
                        <ThemeToggle />
                    </div>

                    {/* High-fidelity Mockup */}
                    <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-sm mx-auto">
                        <GlassmorphicCard intensity="medium" className="w-full p-8 overflow-hidden relative" radius="24px">
                            <div 
                                className="absolute inset-x-0 top-0 h-1 transition-colors duration-500" 
                                style={{ backgroundColor: planAccentColor }}
                            />
                            
                            {/* Study Guide Mockup Title */}
                            <div className="flex items-center justify-between mb-6">
                                <div 
                                    className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all"
                                    style={{
                                        backgroundColor: `${planAccentColor}15`,
                                        borderColor: `${planAccentColor}30`,
                                        color: planAccentColor
                                    }}
                                >
                                    Study Pack Ready
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-white/45 font-mono">Phase 01</span>
                            </div>
                            
                            <h3 className="text-lg font-black italic uppercase tracking-tight text-white mb-1.5 font-heading">
                                Human Anatomy
                            </h3>
                            <p className="text-[11px] text-white/50 leading-relaxed mb-6 font-sans">
                                The Professor's simple breakdown of the important topics. Just the parts that keep you out of trouble.
                            </p>

                            {/* Bullet Preview */}
                            <div className="space-y-3 mb-8">
                                <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                                    <div 
                                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                                        style={{
                                            backgroundColor: `${planAccentColor}15`,
                                            borderColor: `${planAccentColor}35`,
                                            color: planAccentColor
                                        }}
                                    >
                                        <Check size={9} />
                                    </div>
                                    <p className="text-[11px] text-white/70 leading-relaxed font-medium font-sans">
                                        <strong>Photosynthesis:</strong> Light reactions happen in the membrane.
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                                    <div 
                                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                                        style={{
                                            backgroundColor: `${planAccentColor}15`,
                                            borderColor: `${planAccentColor}35`,
                                            color: planAccentColor
                                        }}
                                    >
                                        <Check size={9} />
                                    </div>
                                    <p className="text-[11px] text-white/70 leading-relaxed font-medium font-sans">
                                        <strong>Mitochondria:</strong> It is the powerhouse of the cell.
                                    </p>
                                </div>
                            </div>

                            {/* Floating Mock Flashcard Stack */}
                            <div className="absolute -bottom-8 -right-8 w-60 p-4.5 rounded-2xl bg-[#111115] border border-white/5 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#E5A93C]" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#E5A93C] font-mono">Study Card</span>
                                </div>
                                <h4 className="text-[11px] font-black text-white/80 leading-snug font-sans">
                                    What part of a cell makes energy?
                                </h4>
                                <div className="mt-4 pt-2 border-t border-white/5 flex justify-between items-center text-[7px] text-white/30 uppercase font-black font-mono">
                                    <span>Tap to flip</span>
                                    <ChevronRight size={8} />
                                </div>
                            </div>
                        </GlassmorphicCard>
                    </div>

                    {/* Footer Info */}
                    <div className="text-xs font-bold text-white/40 relative z-10 flex items-center gap-2 font-mono">
                        <Database size={12} style={{ color: planAccentColor }} />
                        <span>Reserves: <strong className="text-white">{isUnlimited ? "∞" : user.credits}</strong> Scholar Credits</span>
                    </div>
                </section>                {/* RIGHT SIDE: Transaction Panel */}
                <section className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 relative bg-[#09090b]">
                    <div className="max-w-md w-full mx-auto space-y-10">
                        
                        {/* Heading */}
                        <div className="space-y-3">
                            <span 
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors duration-500"
                                style={{
                                    backgroundColor: `${planAccentColor}10`,
                                    borderColor: `${planAccentColor}20`,
                                    color: planAccentColor
                                }}
                            >
                                <Sparkles size={9} /> The Sweet Spot
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none italic uppercase font-heading">
                                Upgrade Your Brain
                            </h1>
                            <p className="text-xs text-white/50 leading-relaxed font-sans">
                                Get credits to turn your lecture slides into simple study guides, build cards easily, and download PDFs to study offline when power is out.
                            </p>
                        </div>

                        {/* Active Subscription Block */}
                        {user.planStatus !== 'free' && (
                            <GlassmorphicCard intensity="medium" className="p-6 border border-[#2BB288]/20 relative overflow-hidden" radius="20px">
                                <div className="absolute top-0 right-0 bg-[#2BB288] text-black font-black text-[8px] uppercase px-3 py-1 rounded-bl-xl font-mono">
                                    Active Plan
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 font-mono">Current Subscription</h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-xl font-black text-white italic uppercase font-sans">
                                        {user.planStatus === 'sprint_pass' ? "Weekly Sprint Pass" : user.planStatus === 'plus' ? "Plus Scholar" : "Unlimited Professor"}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 text-[11px] font-medium text-zinc-400 font-mono mb-6">
                                    {user.subscriptionEndDate && (
                                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                                            <span>Renewal Date:</span>
                                            <span className="text-white font-bold">{new Date(user.subscriptionEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                                        <span>Status:</span>
                                        <span className="text-[#2BB288] font-black uppercase tracking-wider">Active</span>
                                    </div>
                                    {user.paystackSubscriptionCode && (
                                        <div className="flex justify-between">
                                            <span>Sub Code:</span>
                                            <span className="text-zinc-500 font-bold">{user.paystackSubscriptionCode}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        playClickTick();
                                        setShowCancelModal(true);
                                    }}
                                    className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                                >
                                    Cancel Subscription
                                </button>
                            </GlassmorphicCard>
                        )}

                        {/* Plan Choice Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Sprint Pass (Weekly) */}
                            <button
                                onClick={() => {
                                    playSelectSound();
                                    setSelectedPlan('sprint_pass');
                                }}
                                className={cn(
                                    "p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[130px]",
                                    selectedPlan === 'sprint_pass'
                                        ? "bg-[#E5A93C]/5 border-[#E5A93C] shadow-[0_0_20px_rgba(229,169,60,0.15)]"
                                        : "bg-white/[0.01] border-white/5 hover:border-white/15"
                                )}
                            >
                                {selectedPlan === 'sprint_pass' && (
                                    <div className="absolute top-0 right-0 bg-[#E5A93C] text-black font-black text-[7px] uppercase px-1.5 py-0.5 rounded-bl-lg font-mono">
                                        Active
                                    </div>
                                )}
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-white/40 mb-1 block font-mono">WEEKLY</span>
                                    <div className="text-base font-black tracking-tight text-white mb-1 font-heading">₦399<span className="text-[10px] font-bold text-white/40 font-mono">/wk</span></div>
                                </div>
                                <p className="text-[9px] text-white/50 leading-normal font-sans">
                                    Instant exam prep. 250 credits/week.
                                </p>
                            </button>

                            {/* Scholar Plan (Monthly) */}
                            <button
                                onClick={() => {
                                    playSelectSound();
                                    setSelectedPlan('plus');
                                }}
                                className={cn(
                                    "p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[130px]",
                                    selectedPlan === 'plus'
                                        ? "bg-[#9673F5]/5 border-[#9673F5] shadow-[0_0_20px_rgba(150,115,245,0.15)]"
                                        : "bg-white/[0.01] border-white/5 hover:border-white/15"
                                )}
                            >
                                {selectedPlan === 'plus' && (
                                    <div className="absolute top-0 right-0 bg-[#9673F5] text-black font-black text-[7px] uppercase px-1.5 py-0.5 rounded-bl-lg font-mono">
                                        Best Value
                                    </div>
                                )}
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-white/40 mb-1 block font-mono">SCHOLAR</span>
                                    <div className="text-base font-black tracking-tight text-white mb-1 font-heading">₦1,499<span className="text-[10px] font-bold text-white/40 font-mono">/mo</span></div>
                                </div>
                                <p className="text-[9px] text-white/50 leading-normal font-sans">
                                    Steady progress. 1,000 credits/mo.
                                </p>
                            </button>

                            {/* Unlimited Plan (Monthly) */}
                            <button
                                onClick={() => {
                                    playSelectSound();
                                    setSelectedPlan('unlimited');
                                }}
                                className={cn(
                                    "p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[130px]",
                                    selectedPlan === 'unlimited'
                                        ? "bg-[#2BB288]/5 border-[#2BB288] shadow-[0_0_20px_rgba(43,178,136,0.15)]"
                                        : "bg-white/[0.01] border-white/5 hover:border-white/15"
                                )}
                            >
                                {selectedPlan === 'unlimited' && (
                                    <div className="absolute top-0 right-0 bg-[#2BB288] text-black font-black text-[7px] uppercase px-1.5 py-0.5 rounded-bl-lg font-mono">
                                        Premium
                                    </div>
                                )}
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-white/40 mb-1 block font-mono">UNLIMITED</span>
                                    <div className="text-base font-black tracking-tight text-white mb-1 font-heading">₦3,999<span className="text-[10px] font-bold text-white/40 font-mono">/mo</span></div>
                                </div>
                                <p className="text-[9px] text-white/50 leading-normal font-sans">
                                    Infinite credits & summaries.
                                </p>
                            </button>
                        </div>

                        {/* Interactive Timeline Module */}
                        <div className="space-y-6">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/35 font-mono">
                                How your free trial works
                            </h3>
                            
                            <div className="relative pl-6 border-l border-white/5 space-y-8">
                                {/* Step 1 */}
                                <div className="relative">
                                    <div 
                                        className="absolute -left-[30px] top-1 w-4 h-4 rounded-full border-4 border-[#09090b] transition-all duration-500" 
                                        style={{ 
                                            backgroundColor: planAccentColor,
                                            boxShadow: `0 0 8px ${planAccentColor}50`
                                        }}
                                    />
                                    <h4 className="text-xs font-black uppercase text-white mb-1 font-mono">
                                        Today: Access Granted
                                    </h4>
                                    <p className="text-xs text-white/50 leading-relaxed font-sans">
                                        Instantly generate your first Study Pack from any textbook, PDF, or slide deck.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-[#18181b] border-4 border-[#09090b]" />
                                    <h4 className="text-xs font-black uppercase text-white mb-1 font-mono">
                                        Day 5: Gentle Reminder
                                    </h4>
                                    <p className="text-xs text-white/50 leading-relaxed font-sans">
                                        We send you a subtle notification that your trial is wrapping up. No surprise charges.
                                    </p>
                                </div>

                                {/* Step 3 */}
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-[#18181b] border-4 border-[#09090b]" />
                                    <h4 className="text-xs font-black uppercase text-white mb-1 font-mono">
                                        Day 7: First Charge
                                    </h4>
                                    <p className="text-xs text-white/50 leading-relaxed font-sans">
                                        First charge ({selectedPlan === 'sprint_pass' ? "₦399" : selectedPlan === 'unlimited' ? "₦3,999" : "₦1,499"}). Billed via Paystack. Cancel anytime in one click.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction CTA Block */}
                        <div className="space-y-4 pt-4">
                            <button
                                onClick={handleStartTrial}
                                disabled={isLoading}
                                className="w-full py-4 bg-white hover:bg-white/95 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10"
                            >
                                {isLoading ? (
                                    <span className="w-4 h-4 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                                ) : (
                                    `Start my ${selectedPlan === 'sprint_pass' ? "Weekly Pass" : selectedPlan === 'unlimited' ? "Unlimited" : "monthly Scholar"} trial`
                                )}
                            </button>
                            
                            <div className="text-center space-y-1 font-mono">
                                <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
                                    Unlock full access in 2 clicks. No hidden setup.
                                </p>
                                <p className="text-[7px] text-white/20 tracking-wider">
                                    POWERED BY PAYSTACK • CANCEL ANYTIME IN SETTINGS
                                </p>
                            </div>
                        </div>

                        {/* Security Trust Badges */}
                        <div className="pt-6 border-t border-white/5 flex items-center gap-3 text-white/30 font-mono">
                            <ShieldCheck size={16} style={{ color: planAccentColor }} className="shrink-0" />
                            <p className="text-[9px] font-black uppercase tracking-widest leading-none">
                                End-to-End Encrypted Payments
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Cancel Subscription Modal */}
            <AnimatePresence>
                {showCancelModal && (
                    <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCancelModal(false)}
                            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xl"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden z-10 p-8"
                            style={{ boxShadow: "inset 0 1px 1px var(--accent-glow), 0 24px 64px rgba(0,0,0,0.3)" }}
                        >
                            <button 
                                onClick={() => setShowCancelModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X size={14} />
                            </button>

                            <div className="mb-6 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                                    <Bell size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight italic text-white">
                                        Cancel Subscription?
                                    </h3>
                                    <p className="text-[11px] text-zinc-400 font-medium mt-1 leading-relaxed">
                                        Are you sure you want to cancel your active subscription? You will instantly lose access to premium features, upload limit upgrades, and offline study materials.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all cursor-pointer"
                                >
                                    Keep Plan
                                </button>
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={isCancelling}
                                    className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/15 hover:bg-red-400 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isCancelling ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            <span>Cancelling...</span>
                                        </>
                                    ) : (
                                        <span>Cancel Subscription</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
