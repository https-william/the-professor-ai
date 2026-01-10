
import React, { useState, useEffect } from 'react';
import { SubscriptionTier } from '../types';

interface PlanCheckoutPageProps {
  tier: SubscriptionTier;
  onBack: () => void;
  onSuccess: (tier: SubscriptionTier) => void;
}

// --- TYPE DEFINITIONS FOR RAW PAYSTACK ---
// This tells TypeScript exactly what the window object looks like
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        metadata?: any;
        callback: (response: any) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export const PlanCheckoutPage: React.FC<PlanCheckoutPageProps> = ({ tier, onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD');

  // Pricing Matrix
  const PRICES = {
      Scholar: { NGN: 2900, USD: 4.99 },
      Excellentia: { NGN: 8500, USD: 14.99 }
  };

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Africa/Lagos') setCurrency('NGN');
    } catch(e) { setCurrency('USD'); }
  }, []);

  const price = PRICES[tier as keyof typeof PRICES]?.[currency] || 0;

  const handleCheckout = (e: React.FormEvent) => {
      e.preventDefault();
      
      // 1. Validation
      if (!email || !email.includes('@')) {
          alert("A valid communication channel is required.");
          return;
      }

      // 2. Environment Key Check
      // @ts-ignore
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      
      if (!publicKey) {
          console.error("Paystack Key Missing. Check Vercel Environment Variables.");
          alert("System Error: Payment Link Not Configured.");
          return;
      }

      // 3. Script Load Check
      if (!window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
          alert("Secure Gateway (Paystack) not loaded. Please refresh or disable ad-blockers.");
          return;
      }

      setLoading(true);

      try {
        // 4. MANUAL MODE EXECUTION
        // Do NOT use 'new PaystackPop()'. Use 'PaystackPop.setup()'.
        const handler = window.PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: price * 100, // Amount in kobo/cents
            currency: currency,
            ref: 'PRO_' + Math.floor((Math.random() * 1000000000) + 1), 
            metadata: {
                tier: tier,
                custom_fields: [{ display_name: "Subscription Tier", variable_name: "tier", value: tier }]
            },
            callback: (response: any) => {
                // Payment Success
                console.log("Payment complete", response);
                onSuccess(tier);
                alert(`Welcome to the elite. Reference: ${response.reference}`);
                setLoading(false);
            },
            onClose: () => {
                // User closed popup
                console.log("Transaction aborted");
                setLoading(false);
            }
        });

        // 5. Trigger
        handler.openIframe();

      } catch (e) {
          console.error("Paystack Init Error:", e);
          alert("Secure link failed. Check console for details.");
          setLoading(false);
      }
  };

  const copy = tier === 'Excellentia' ? {
      title: "Academic God Mode",
      subtitle: "The unfair advantage.",
      warning: "WARNING: This plan is not for casual students. It is for those who intend to dominate.",
      benefits: [
          "Prophetic Accuracy: The Oracle predicts your exam questions.",
          "Limitless Power: No quotas. No caps. Pure throughput.",
          "Priority Processing: You skip the line. Every time.",
          "Admin Support: Direct line to the Dean's office."
      ]
  } : {
      title: "The Scholar's Edge",
      subtitle: "Stop struggling. Start flowing.",
      warning: "FACT: 85% of students waste 2 hours a day just organizing notes. You can fix that right now.",
      benefits: [
          "Unlimited Quizzes: Drill until you can't get it wrong.",
          "Feynman Tutor: Concepts explained so simply, a child would understand.",
          "War Room Access: Collaborative study hubs.",
          "10x File Uploads: Process entire semesters in minutes."
      ]
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <button onClick={onBack} className="text-gray-500 hover:text-white text-xs uppercase tracking-widest">← Abort Transaction</button>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Gateway</span>
            </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-6 gap-12 items-center justify-center">
            <div className="w-full md:w-1/2 space-y-8 animate-slide-in">
                <div>
                    <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4 leading-tight">{copy.title}</h1>
                    <p className="text-xl text-gray-400 font-light">{copy.subtitle}</p>
                </div>
                <div className="bg-red-900/10 border-l-4 border-red-500 p-6 rounded-r-xl">
                    <p className="text-red-400 font-mono text-xs uppercase tracking-widest mb-2 font-bold">Reality Check</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{copy.warning}</p>
                </div>
                <ul className="space-y-4">
                    {copy.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-4">
                            <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-black font-bold text-xs ${tier === 'Excellentia' ? 'bg-amber-500' : 'bg-blue-500'}`}>✓</div>
                            <span className="text-gray-300 text-sm">{benefit}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="w-full md:w-1/3 bg-[#0f0f10] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-slide-up-fade">
                <div className={`absolute top-0 left-0 w-full h-1 ${tier === 'Excellentia' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total Investment</p>
                        <h2 className="text-4xl font-mono font-bold text-white mt-2">
                            {currency === 'NGN' ? '₦' : '$'}{price.toLocaleString()}
                        </h2>
                    </div>
                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 uppercase">Monthly</span>
                </div>

                <form onSubmit={handleCheckout} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Secure Delivery Address</label>
                        <input 
                            type="email" 
                            required
                            placeholder="student@university.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-white/30 transition-colors"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all relative overflow-hidden flex items-center justify-center gap-2 ${
                            loading ? 'bg-green-900/20 border border-green-500/30 text-green-400' :
                            tier === 'Excellentia' 
                            ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20 hover:scale-[1.02]' 
                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 hover:scale-[1.02]'
                        }`}
                    >
                        {loading ? (
                            <>
                                <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent -translate-x-full animate-[shimmer_1s_infinite]"></div>
                                <span className="relative z-10">Establishing Secure Tunnel...</span>
                            </>
                        ) : (
                            <>
                                Confirm Upgrade
                                <span>→</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-[9px] text-gray-600 mt-6 uppercase tracking-widest">
                    Encrypted via Paystack. Cancel Anytime.
                </p>
            </div>
        </div>
    </div>
  );
};
