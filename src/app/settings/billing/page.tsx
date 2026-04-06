"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";

const plans = [
    { id: "student", name: "Student Stash", credits: 500, price: 500, label: "₦500", perks: ["100 Flashcard Decks", "100 Quizzes"] },
    { id: "scholar", name: "Scholar Stack", credits: 1200, price: 1000, label: "₦1,000", popular: true, perks: ["240 Flashcard Decks", "240 Quizzes", "Best Value"] },
    { id: "professor", name: "Professor's Grant", credits: 3000, price: 2000, label: "₦2,000", perks: ["600 Flashcard Decks", "600 Quizzes", "Priority Processing"] },
];

export default function BillingPage() {
    const { user, refreshUser } = useUser();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [successPlan, setSuccessPlan] = useState<string | null>(null);

    const handleTopUp = async (plan: typeof plans[0]) => {
        setIsLoading(plan.id);
        try {
            const res = await fetch("/api/paystack/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: plan.price * 100, plan: plan.id }),
            });

            const data = await res.json();

            if (!data.authorization_url) {
                throw new Error(data.error || "Failed to initialize payment");
            }

            // Use Paystack inline popup instead of page redirect
            const PaystackPop = (await import("@paystack/inline-js")).default;
            const popup = new PaystackPop();
            popup.resumeTransaction(data.reference, {
                onSuccess: async () => {
                    setSuccessPlan(plan.name);
                    await refreshUser();
                    setIsLoading(null);
                },
                onCancel: () => {
                    setIsLoading(null);
                },
            });

            // Fallback: if inline doesn't work, open the URL
            if (!popup) {
                window.open(data.authorization_url, "_blank");
            }
        } catch (error: any) {
            console.error("Payment Error:", error);
            alert(error.message || "Payment Error. Please try again.");
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#06060B] text-white pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6 bg-[#06060B]/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold">Academic Endowment</h1>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Credit Management</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                {/* Success Banner */}
                {successPlan && (
                    <div className="mb-8 p-5 rounded-[24px] nm-flat flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#10B981]">verified</span>
                        </div>
                        <div>
                            <p className="font-bold text-white/90 text-sm">{successPlan} Endowment Confirmed</p>
                            <p className="text-[11px] text-white/30">Your academic search capabilities have been expanded.</p>
                        </div>
                        <button onClick={() => setSuccessPlan(null)} className="ml-auto text-white/20">
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                )}

                {/* Current Balance */}
                <div className="nm-flat rounded-[32px] p-8 mb-12 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mb-3">Available Reserves</p>
                        <h2 className="text-5xl font-black text-white flex items-baseline gap-3">
                            {user.credits} <span className="text-xl text-white/20 font-bold tracking-tight">Credits</span>
                        </h2>
                    </div>
                    <div className="w-20 h-20 rounded-[28px] nm-inset flex items-center justify-center transition-transform group-hover:scale-105">
                        <span className="material-symbols-outlined text-[#F59E0B] text-3xl">account_balance_wallet</span>
                    </div>
                </div>

                {/* Plans */}
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Endowment Tier Selection</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-6 rounded-[32px] transition-all nm-flat flex flex-col ${plan.popular ? 'ring-2 ring-[#F59E0B]/20' : ''}`}
                        >
                            {plan.popular && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#F59E0B] text-[#08080E] text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">
                                    Priority Status
                                </span>
                            )}
                            <div className="mb-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F59E0B]/80 mb-1">{plan.name}</h4>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-4xl font-black text-white">{plan.credits}</span>
                                    <span className="text-xs text-white/20 font-bold uppercase tracking-widest">Units</span>
                                </div>
                                <div className="mt-2 p-1.5 rounded-xl nm-inset w-fit">
                                    <span className="text-sm font-black text-[#F59E0B] px-2">{plan.label}</span>
                                </div>
                            </div>
                            
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.perks.map((perk) => (
                                    <li key={perk} className="flex items-start gap-3 text-[12px] text-white/40 leading-tight">
                                        <span className="material-symbols-outlined text-[#10B981] text-[14px] mt-0.5">verified</span>
                                        {perk}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleTopUp(plan)}
                                disabled={!!isLoading}
                                className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all nm-button flex items-center justify-center gap-3 ${plan.popular
                                    ? "bg-[#F59E0B] text-[#08080E] hover:shadow-[0_10px_25px_rgba(245,158,11,0.2)]"
                                    : "text-white/60 hover:text-white"
                                    }`}
                            >
                                {isLoading === plan.id ? (
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                ) : (
                                    "Initialize"
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-center space-y-2 opacity-30">
                    <div className="w-12 h-px bg-white/20 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">
                        The Professor \u2014 Institutional Grade Security
                    </p>
                </div>
            </main>
        </div>
    );
}
