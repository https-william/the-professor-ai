import React, { useState, useEffect } from 'react';
import { SubscriptionTier } from '../types';

interface PlanCheckoutPageProps {
  tier: SubscriptionTier;
  onBack: () => void;
  onSuccess: (tier: SubscriptionTier) => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => { openIframe: () => void };
    };
  }
}

export const PlanCheckoutPage: React.FC<PlanCheckoutPageProps> = ({ tier, onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD');
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Africa/Lagos') setCurrency('NGN');
    } catch(e) { setCurrency('USD'); }
    
    const pendingCycle = localStorage.getItem('pending_billing_cycle');
    if (pendingCycle) setBillingCycle(pendingCycle);
  }, []);

  // PRICING CONSTANTS
  const PRICES = {
      Scholar: { 
          monthly: { NGN: 2900, USD: 4.99 },
          annually: { NGN: 29000, USD: 49.99 }
      },
      Excellentia: { 
          monthly: { NGN: 8500, USD: 14.99 },
          annually: { NGN: 85000, USD: 149.99 }
      }
  };

  const getPlanCode = (tier: string, cycle: string) => {
      // Retrieve Plan Codes from Env or Fallback to null (which means it will use amount)
      // Note: For recurring billing to work automatically, PLAN CODES are required.
      // If no plan code is found, it falls back to a one-time charge (amount).
      
      const key = `VITE_PAYSTACK_PLAN_${tier.toUpperCase()}_${cycle.toUpperCase()}`;
      // @ts-ignore
      return import.meta.env[key] || undefined;
  };

  // @ts-ignore
  const price = PRICES[tier]?.[billingCycle]?.[currency] || 0;

  const handleCheckout = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!email || !email.includes('@')) {
          alert("A valid communication channel is required.");
          return;
      }

      // @ts-ignore
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      
      if (!publicKey) {
          alert("System Error: Payment Link Not Configured.");
          return;
      }

      setLoading(true);

      try {
        const planCode = getPlanCode(tier, billingCycle);
        
        const handler = window.PaystackPop.setup({
            key: publicKey,
            email: email,
            // If plan code exists, use it. If not, use amount * 100
            ...(planCode ? { plan: planCode } : { amount: price * 100 }),
            currency: currency,
            ref: 'PRO_' + Math.floor((Math.random() * 1000000000) + 1), 
            metadata: {
                tier: tier,
                billing_cycle: billingCycle,
                custom_fields: [
                    { display_name: "Subscription Tier", variable_name: "tier", value: tier },
                    { display_name: "Billing Cycle", variable_name: "cycle", value: billingCycle }
                ]
            },
            callback: (response: any) => {
                onSuccess(tier);
                alert(`Welcome to the elite. Reference: ${response.reference}`);
                setLoading(false);
            },
            onClose: () => {
                setLoading(false);
            }
        });
        handler.openIframe();
      } catch (e) {
          console.error("Paystack Init Error:", e);
          setLoading(false);
      }
  };

  const isGold = tier === 'Excellentia';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
        {/* Background FX */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20 ${isGold ? 'bg-amber-600' : 'bg-blue-600'}`}></div>

        <div className="p-6 flex justify-between items-center z-10">
            <button onClick={onBack} className="text-gray-500 hover:text-white text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                <span>←</span> ABORT TRANSACTION
            </button>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SECURE LINK ESTABLISHED</span>
            </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative">
            
            <div className="w-full max-w-lg perspective-1000">
                <div className={`bg-[#0a0a0c] border relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 ${isGold ? 'border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.15)]' : 'border-blue-500/30 shadow-[0_0_60px_rgba(59,130,246,0.15)]'}`}>
                    
                    {/* Scanner Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 z-20 ${isGold ? 'bg-amber-500 shadow-[0_0_20px_orange]' : 'bg-blue-500 shadow-[0_0_20px_blue]'} animate-[slideIn_3s_linear_infinite]`}></div>

                    <div className="p-10 relative z-10">
                        <div className="text-center mb-8">
                            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 border ${isGold ? 'bg-amber-900/10 border-amber-500/20 text-amber-500' : 'bg-blue-900/10 border-blue-500/20 text-blue-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <h1 className="text-4xl font-display font-bold text-white mb-2">{isGold ? 'EXCELLENTIA ACCESS' : 'SCHOLAR PASS'}</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-[0.3em]">{billingCycle} • {isGold ? 'VIP NEURAL ACCESS' : 'STANDARD LICENSE'}</p>
                        </div>

                        <div className="flex justify-between items-end mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Due Now</p>
                                <p className="text-3xl font-mono font-bold text-white">{currency === 'NGN' ? '₦' : '$'}{price.toLocaleString()}</p>
                            </div>
                            <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${isGold ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'}`}>
                                {isGold ? 'GOLD TIER' : 'STD TIER'}
                            </div>
                        </div>

                        <form onSubmit={handleCheckout} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Billing Email</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="scholar@university.edu"
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-white/30 transition-all font-mono text-sm"
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`w-full py-5 rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isGold ? 'bg-white text-black hover:bg-amber-50' : 'bg-white text-black hover:bg-blue-50'}`}
                            >
                                {loading ? 'INITIATING GATEWAY...' : 'CONFIRM PAYMENT'}
                            </button>
                        </form>
                        
                        <div className="mt-6 flex items-center justify-center gap-4 opacity-40">
                            <div className="h-3 w-8 bg-gray-500 rounded"></div>
                            <div className="h-3 w-8 bg-gray-500 rounded"></div>
                            <div className="h-3 w-8 bg-gray-500 rounded"></div>
                        </div>
                        
                        <p className="text-[10px] text-gray-600 text-center mt-4">
                            Secured by Paystack. Encrypted Transaction.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};