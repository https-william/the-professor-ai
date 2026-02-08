
"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";

export default function BillingPage() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const plans = [
        { id: "student", name: "Student Stash", credits: 500, price: 500, label: "₦500" },
        { id: "scholar", name: "Scholar Stack", credits: 1200, price: 1000, label: "₦1,000", popular: true },
        { id: "professor", name: "Professor's Grant", credits: 3000, price: 2000, label: "₦2,000" },
    ];

    const handleTopUp = async (plan: any) => {
        setIsLoading(plan.id);
        try {
            const res = await fetch("/api/paystack/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: plan.price * 100, plan: plan.id }) // Convert NGN to Kobo
            });
            const data = await res.json();

            if (data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                alert("Failed to initialize payment");
            }
        } catch (error) {
            console.error(error);
            alert("Payment Error");
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6 pb-24">
            <header className="mb-8">
                <button onClick={() => window.history.back()} className="mb-4 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">arrow_back</span> Back
                </button>
                <h1 className="text-3xl font-bold mb-2">Billing & Credits</h1>
                <p className="text-[var(--foreground-secondary)]">Top up your credits to keep generating magic.</p>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-[var(--foreground-muted)] font-medium uppercase tracking-wider mb-1">Current Balance</p>
                        <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)]">
                            {user.credits} <span className="text-2xl text-[var(--foreground)]">Credits</span>
                        </h2>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--accent)] text-3xl">account_balance_wallet</span>
                    </div>
                </div>

                <h3 className="text-xl font-bold mb-6">Top Up Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`relative p-6 rounded-3xl border-2 transition-all ${plan.popular ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-xl shadow-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--foreground-muted)]'}`}>
                            {plan.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--accent)] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                                    Best Value
                                </span>
                            )}
                            <h4 className="text-lg font-bold mb-2">{plan.name}</h4>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-bold">{plan.credits}</span>
                                <span className="text-sm text-[var(--foreground-muted)]">credits</span>
                            </div>
                            <ul className="space-y-2 mb-6 text-sm text-[var(--foreground-secondary)]">
                                <li className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[var(--success)] text-base">check</span>
                                    {(plan.credits / 5).toFixed(0)} Flashcard Decks
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[var(--success)] text-base">check</span>
                                    {(plan.credits / 5).toFixed(0)} Quizzes
                                </li>
                            </ul>
                            <button
                                onClick={() => handleTopUp(plan)}
                                disabled={!!isLoading}
                                className={`w-full py-3 rounded-xl font-bold transition-all ${plan.popular ? 'bg-[var(--accent)] text-white hover:opacity-90' : 'bg-[var(--background-tertiary)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]'}`}
                            >
                                {isLoading === plan.id ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    `Buy for ${plan.label}`
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <p className="mt-8 text-center text-xs text-[var(--foreground-muted)]">
                    Payments secured by Paystack. Credits do not expire.
                </p>
            </div>
        </div>
    );
}
