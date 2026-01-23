
import React, { useState, useEffect } from 'react';
import { SubscriptionTier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cancelSubscription, getPaymentHistory, getCreditHistory } from '../services/supabase';
import { trackEvent } from '../services/analytics';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTier: SubscriptionTier;
    onUpgrade: (tier: SubscriptionTier, billingCycle: string) => void;
    userEmail?: string;
}

declare global {
    interface Window {
        PaystackPop: {
            setup: (options: any) => { openIframe: () => void };
        };
    }
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentTier, onUpgrade, userEmail }) => {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'SUBSCRIPTION' | 'CREDITS' | 'HISTORY'>('CREDITS');
    const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD');
    const [processingPack, setProcessingPack] = useState<number | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Load Paystack script dynamically if not present
    useEffect(() => {
        if (isOpen && typeof window.PaystackPop === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeTab === 'HISTORY' && user) {
            Promise.all([
                getPaymentHistory(user.uid),
                getCreditHistory(user.uid)
            ]).then(([payments, credits]) => {
                const combined = [
                    ...payments.map(p => ({ ...p, type: 'PAYMENT' })),
                    ...credits.map(c => ({ ...c, type: 'CREDIT_LOG' }))
                ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setHistory(combined);
            });
        }
    }, [activeTab, user]);

    useEffect(() => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz === 'Africa/Lagos') setCurrency('NGN');
        } catch (e) { setCurrency('USD'); }
    }, []);

    if (!isOpen) return null;

    const handleBuyCredits = (pack: { amount: number, priceRaw: number, label: string }) => {
        if (!window.PaystackPop) {
            alert("Secure Gateway Initializing... Please try again in 3 seconds.");
            return;
        }

        // @ts-ignore
        const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        if (!publicKey) {
            alert("Payment system offline (Key Missing).");
            return;
        }

        setProcessingPack(pack.amount);

        try {
            const handler = window.PaystackPop.setup({
                key: publicKey,
                email: userEmail,
                amount: pack.priceRaw * 100,
                currency: currency,
                ref: 'CREDIT_' + Math.floor((Math.random() * 1000000000) + 1),
                metadata: {
                    type: 'CREDIT_PURCHASE',
                    credits: pack.amount
                },
                callback: async (response: any) => {
                    alert("Success! Credits adding...");
                    setProcessingPack(null);
                    setTimeout(() => { refreshUser(); onClose(); }, 3000);
                },
                onClose: () => setProcessingPack(null)
            });
            handler.openIframe();
        } catch (e) {
            setProcessingPack(null);
            alert("Gateway Error.");
        }
    };

    const creditPacks = [
        { amount: 300, price: currency === 'NGN' ? '₦900' : '$1.50', priceRaw: currency === 'NGN' ? 900 : 1.5, label: 'Starter' },
        { amount: 1000, price: currency === 'NGN' ? '₦2,500' : '$3.99', priceRaw: currency === 'NGN' ? 2500 : 3.99, label: 'Value' },
        { amount: 2500, price: currency === 'NGN' ? '₦5,500' : '$8.99', priceRaw: currency === 'NGN' ? 5500 : 8.99, label: 'Pro' }
    ];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-4xl glass-container overflow-hidden flex flex-col max-h-[90vh]">
                {/* Glass layers */}
                <div className="glass-filter" />
                <div className="glass-overlay" />
                <div className="glass-specular" />
                <div className="relative z-10 flex flex-col h-full">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Neural Bank</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                    </div>

                    <div className="flex justify-center p-4">
                        <div className="bg-white/5 rounded-full p-1 flex gap-1">
                            {['CREDITS', 'SUBSCRIPTION', 'HISTORY'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        {activeTab === 'CREDITS' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {creditPacks.map((pack, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all flex flex-col items-center text-center group">
                                        <div className="text-2xl mb-2">💎</div>
                                        <h3 className="text-xl font-bold text-white mb-1">{pack.amount} NT</h3>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">{pack.label}</p>
                                        <button
                                            onClick={() => handleBuyCredits(pack)}
                                            disabled={processingPack !== null}
                                            className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase hover:bg-blue-500 hover:text-white transition-colors"
                                        >
                                            {processingPack === pack.amount ? '...' : `Buy ${pack.price}`}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'SUBSCRIPTION' && (
                            <div className="text-center">
                                {currentTier !== 'Fresher' ? (
                                    <div className="p-8 border border-amber-500/30 bg-amber-900/10 rounded-2xl">
                                        <h3 className="text-2xl font-bold text-white mb-2">Active: {currentTier}</h3>
                                        <p className="text-gray-400 text-sm">Your subscription is active and auto-renewing.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Scholar */}
                                        <div className="p-6 border border-blue-500/30 bg-blue-900/10 rounded-2xl text-left">
                                            <h3 className="text-lg font-bold text-white mb-1">Scholar</h3>
                                            <p className="text-2xl font-bold text-blue-400 mb-4">{currency === 'NGN' ? '₦2,900' : '$4.99'}<span className="text-sm text-gray-500">/mo</span></p>
                                            <ul className="text-sm text-gray-300 space-y-2 mb-6">
                                                <li>✓ 1,500 Credits / Month</li>
                                                <li>✓ Priority Processing</li>
                                            </ul>
                                            <button onClick={() => onUpgrade('Scholar', 'monthly')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-blue-500">Upgrade</button>
                                        </div>
                                        {/* Excellentia */}
                                        <div className="p-6 border border-amber-500/30 bg-gradient-to-b from-amber-900/10 to-black rounded-2xl text-left relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase">Best</div>
                                            <h3 className="text-lg font-bold text-white mb-1">Excellentia</h3>
                                            <p className="text-2xl font-bold text-amber-400 mb-4">{currency === 'NGN' ? '₦8,500' : '$14.99'}<span className="text-sm text-gray-500">/mo</span></p>
                                            <ul className="text-sm text-gray-300 space-y-2 mb-6">
                                                <li>✓ 6,000 Credits / Month</li>
                                                <li>✓ The Oracle (Prediction)</li>
                                                <li>✓ VIP Support</li>
                                            </ul>
                                            <button onClick={() => onUpgrade('Excellentia', 'monthly')} className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase hover:bg-amber-100">Go Ultimate</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'HISTORY' && (
                            <div className="space-y-2">
                                {history.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg text-sm">
                                        <span className="text-gray-300">{item.description || item.reference || 'Transaction'}</span>
                                        <span className={item.amount > 0 ? 'text-green-400' : 'text-red-400'}>{item.amount}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
