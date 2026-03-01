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
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold">Billing & Credits</h1>
                        <p className="text-xs text-[var(--foreground-muted)]">Top up to keep generating</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Success Banner */}
                {successPlan && (
                    <div className="mb-6 p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 flex items-center gap-3">
                        <span className="material-symbols-outlined text-[var(--success)]">check_circle</span>
                        <div>
                            <p className="font-semibold text-[var(--success)] text-sm">{successPlan} unlocked!</p>
                            <p className="text-xs text-[var(--foreground-secondary)]">Credits have been added to your account.</p>
                        </div>
                        <button onClick={() => setSuccessPlan(null)} className="ml-auto text-[var(--foreground-muted)]">
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                )}

                {/* Current Balance */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[var(--foreground-muted)] font-semibold uppercase tracking-wider mb-1">Current Balance</p>
                        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] to-amber-400">
                            {user.credits} <span className="text-xl text-[var(--foreground)] font-semibold">Credits</span>
                        </h2>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--accent)] text-2xl">account_balance_wallet</span>
                    </div>
                </div>

                {/* Plans */}
                <h3 className="text-base font-bold mb-4">Top Up Plans</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-5 rounded-2xl border-2 transition-all ${plan.popular
                                ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg shadow-[var(--accent)]/10"
                                : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--foreground-muted)]/40"
                                }`}
                        >
                            {plan.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--accent)] text-[#08080E] text-xs font-black rounded-full uppercase tracking-wider">
                                    Best Value
                                </span>
                            )}
                            <h4 className="text-sm font-bold mb-1">{plan.name}</h4>
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="text-3xl font-black">{plan.credits}</span>
                                <span className="text-xs text-[var(--foreground-muted)]">credits</span>
                            </div>
                            <ul className="space-y-1.5 mb-5">
                                {plan.perks.map((perk) => (
                                    <li key={perk} className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                                        <span className="material-symbols-outlined text-[var(--success)] text-sm">check</span>
                                        {perk}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleTopUp(plan)}
                                disabled={!!isLoading}
                                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${plan.popular
                                    ? "bg-[var(--accent)] text-[#08080E] hover:opacity-90 shadow-md shadow-[var(--accent)]/20"
                                    : "bg-[var(--background-tertiary)] text-[var(--foreground)] hover:bg-[var(--border)]"
                                    }`}
                            >
                                {isLoading === plan.id ? (
                                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                ) : (
                                    `Buy for ${plan.label}`
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <p className="text-center text-xs text-[var(--foreground-muted)]">
                    🔒 Payments secured by Paystack · Credits never expire
                </p>
            </main>
        </div>
    );
}
