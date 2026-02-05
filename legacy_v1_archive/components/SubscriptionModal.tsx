
import React, { useState, useEffect } from 'react';
import { SubscriptionTier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cancelSubscription, getPaymentHistory, getCreditHistory } from '../services/supabase';

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
            alert("Gateway Initializing... Please wait.");
            return;
        }

        // @ts-ignore
        const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        if (!publicKey) {
            alert("Payment system offline.");
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
                    alert("Success. Credits added.");
                    setProcessingPack(null);
                    setTimeout(() => { refreshUser(); onClose(); }, 2000);
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
        { amount: 1000, price: currency === 'NGN' ? '₦2,500' : '$3.99', priceRaw: currency === 'NGN' ? 2500 : 3.99, label: 'Standard' },
        { amount: 2500, price: currency === 'NGN' ? '₦5,500' : '$8.99', priceRaw: currency === 'NGN' ? 5500 : 8.99, label: 'Premium' }
    ];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-[#0c0c0c] rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10 shadow-2xl">

                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111]">
                    <h2 className="text-xl font-serif text-white">Account & Credits</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="flex justify-center p-4 bg-[#0a0a0c]">
                    <div className="bg-white/5 rounded-full p-1 flex gap-1 border border-white/5">
                        {['CREDITS', 'SUBSCRIPTION', 'HISTORY'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-2 rounded-full text-xs font-bold uppercase transition-all tracking-widest ${activeTab === tab ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#0a0a0c]">
                    {activeTab === 'CREDITS' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {creditPacks.map((pack, i) => (
                                <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all flex flex-col items-center text-center group">
                                    <div className="text-2xl mb-2 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">💎</div>
                                    <h3 className="text-xl font-bold text-white mb-1">{pack.amount} Credits</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">{pack.label}</p>
                                    <button
                                        onClick={() => handleBuyCredits(pack)}
                                        disabled={processingPack !== null}
                                        className="w-full py-3 bg-white/10 text-white border border-white/10 rounded-lg font-bold text-xs uppercase hover:bg-white hover:text-black transition-all"
                                    >
                                        {processingPack === pack.amount ? 'Processing...' : `Purchase ${pack.price}`}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'SUBSCRIPTION' && (
                        <div className="text-center">
                            {currentTier !== 'Fresher' ? (
                                <div className="p-8 border border-white/10 bg-white/5 rounded-2xl">
                                    <h3 className="text-2xl font-serif text-white mb-2">Current Plan: {currentTier}</h3>
                                    <p className="text-gray-400 text-sm">Your academic plan is active.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Scholar */}
                                    <div className="p-6 border border-white/10 bg-white/5 rounded-2xl text-left hover:border-blue-500/30 transition-colors">
                                        <h3 className="text-lg font-serif text-white mb-1">Scholar</h3>
                                        <p className="text-2xl font-light text-white mb-4">{currency === 'NGN' ? '₦2,900' : '$4.99'}<span className="text-sm text-gray-500">/mo</span></p>
                                        <ul className="text-sm text-gray-400 space-y-2 mb-8 font-mono">
                                            <li>• 1,500 Monthly Credits</li>
                                            <li>• Priority Processing</li>
                                            <li>• Advanced Reasoning</li>
                                        </ul>
                                        <button onClick={() => onUpgrade('Scholar', 'monthly')} className="w-full py-3 bg-white/10 text-white border border-white/10 rounded-lg font-bold text-xs uppercase hover:bg-white hover:text-black transition-all">Select Plan</button>
                                    </div>
                                    {/* Excellentia */}
                                    <div className="p-6 border border-amber-500/20 bg-gradient-to-b from-amber-900/10 to-black rounded-2xl text-left relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-amber-900/40 text-amber-200 border-l border-b border-amber-500/20 text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">Recommended</div>
                                        <h3 className="text-lg font-serif text-amber-100 mb-1">Excellentia</h3>
                                        <p className="text-2xl font-light text-amber-400 mb-4">{currency === 'NGN' ? '₦8,500' : '$14.99'}<span className="text-sm text-gray-500">/mo</span></p>
                                        <ul className="text-sm text-gray-400 space-y-2 mb-8 font-mono">
                                            <li>• 6,000 Monthly Credits</li>
                                            <li>• Predictive Analytics</li>
                                            <li>• 24/7 Academic Support</li>
                                        </ul>
                                        <button onClick={() => onUpgrade('Excellentia', 'monthly')} className="w-full py-3 bg-amber-500 text-black rounded-lg font-bold text-xs uppercase hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">Upgrade Now</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'HISTORY' && (
                        <div className="space-y-2">
                            {history.length > 0 ? history.map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-lg text-sm border border-white/5">
                                    <span className="text-gray-300 font-mono">{item.description || item.reference || 'Transaction'}</span>
                                    <span className={`font-mono ${item.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{item.amount > 0 ? '+' : ''}{item.amount}</span>
                                </div>
                            )) : (
                                <div className="text-center text-gray-600 py-10">No transaction history found.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
