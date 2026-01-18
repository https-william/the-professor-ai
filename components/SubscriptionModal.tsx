
import React, { useState, useEffect } from 'react';
import { SubscriptionTier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { deductCredits, cancelSubscription, getPaymentHistory, getCreditHistory, supabase } from '../services/supabase';
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD');
  const [processingPack, setProcessingPack] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load history when tab changes
  useEffect(() => {
      if (activeTab === 'HISTORY' && user) {
          setLoadingHistory(true);
          Promise.all([
              getPaymentHistory(user.uid),
              getCreditHistory(user.uid)
          ]).then(([payments, credits]) => {
              // Combine and sort
              const combined = [
                  ...payments.map(p => ({ ...p, type: 'PAYMENT' })),
                  ...credits.map(c => ({ ...c, type: 'CREDIT_LOG' }))
              ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              setHistory(combined);
              setLoadingHistory(false);
          });
      }
  }, [activeTab, user]);

  useEffect(() => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === 'Africa/Lagos') setCurrency('NGN');
      } catch(e) { setCurrency('USD'); }
  }, []);

  // Determine Default View based on Tier
  useEffect(() => {
      if (isOpen) {
          trackEvent('subscription_modal_opened', { tier: currentTier });
          if (currentTier !== 'Fresher') setActiveTab('SUBSCRIPTION');
          else setActiveTab('CREDITS');
      }
  }, [isOpen, currentTier]);

  if (!isOpen) return null;

  const handleBuyCredits = (pack: { amount: number, priceRaw: number, label: string }) => {
      if (!userEmail) {
          alert("Please log in to purchase credits.");
          return;
      }

      // @ts-ignore
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
          alert("Payment system offline (Key Missing).");
          return;
      }

      setProcessingPack(pack.amount);
      trackEvent('credit_checkout_initiated', { amount: pack.amount, price: pack.priceRaw });

      try {
          const handler = window.PaystackPop.setup({
              key: publicKey,
              email: userEmail,
              amount: pack.priceRaw * 100, // Paystack expects Kobo/Cents
              currency: currency,
              ref: 'CREDIT_' + Math.floor((Math.random() * 1000000000) + 1),
              metadata: {
                  type: 'CREDIT_PURCHASE',
                  credits: pack.amount,
                  custom_fields: [
                      { display_name: "Item", variable_name: "item", value: pack.label },
                      { display_name: "Credits", variable_name: "credits", value: pack.amount }
                  ]
              },
              callback: async (response: any) => {
                  trackEvent('credit_checkout_success', { amount: pack.amount, ref: response.reference });
                  alert(`Payment Successful! Reference: ${response.reference}. Your credits will appear momentarily.`);
                  setProcessingPack(null);
                  setTimeout(() => refreshUser(), 2000); 
                  onClose();
              },
              onClose: () => {
                  setProcessingPack(null);
              }
          });
          handler.openIframe();
      } catch (e) {
          console.error("Payment Error", e);
          setProcessingPack(null);
          alert("Failed to initialize payment gateway.");
      }
  };

  const handleCancelSub = async () => {
      if (confirm("Are you sure? You will lose access to premium features at the end of your billing cycle.")) {
          if (user) {
              await cancelSubscription(user.uid);
              trackEvent('subscription_cancelled');
              alert("Subscription cancelled. You will retain access until the period ends.");
              refreshUser();
          }
      }
  };

  const tiers = [
    {
      id: 'Fresher' as SubscriptionTier,
      name: 'Fresher',
      price: 'Free',
      period: 'Forever',
      desc: "50 Credits Welcome Bonus. 5 Credits/Day.",
      features: ['5 NT / Day (Login Bonus)', 'Basic Exams', 'Community Support'],
      style: 'bg-white/5 border-white/10 text-gray-400',
      btnStyle: 'bg-white/10 text-white hover:bg-white/20'
    },
    {
      id: 'Scholar' as SubscriptionTier,
      name: 'Scholar',
      price: billingCycle === 'monthly' ? (currency === 'NGN' ? '₦2,900' : '$4.99') : (currency === 'NGN' ? '₦29,000' : '$49.99'),
      period: billingCycle === 'monthly' ? '/mo' : '/yr',
      savings: billingCycle === 'annually' ? (currency === 'NGN' ? 'Save ₦5,800' : 'Save $10') : null,
      desc: "1,500 Credits Monthly Allowance.",
      features: ['1,500 NT / Month', 'Rollover unused credits (up to 500)', 'Priority Processing', 'Access to Professor Chat'],
      style: 'bg-blue-900/20 border-blue-500/30 text-blue-100 relative overflow-hidden',
      btnStyle: 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20',
      tag: 'Most Popular',
      tagColor: 'bg-blue-500'
    },
    {
      id: 'Excellentia' as SubscriptionTier, 
      name: 'Excellentia',
      price: billingCycle === 'monthly' ? (currency === 'NGN' ? '₦8,500' : '$14.99') : (currency === 'NGN' ? '₦85,000' : '$149.99'),
      period: billingCycle === 'monthly' ? '/mo' : '/yr',
      savings: billingCycle === 'annually' ? (currency === 'NGN' ? 'Save ₦17,000' : 'Save $30') : null,
      desc: "6,000 Credits Monthly Allowance.",
      features: ['6,000 NT / Month', 'Unlimited Rollover', '20% Credit Cost Discount', 'The Oracle Access', 'War Room Analytics'],
      style: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)]',
      btnStyle: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold shadow-lg shadow-amber-500/30 hover:scale-105',
      tag: 'BEST VALUE',
      tagColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black'
    }
  ];

  // Updated Credit Packs with Psychological Pricing
  const creditPacks = [
      { 
        amount: 300, 
        price: currency === 'NGN' ? '₦900' : '$1.50', 
        priceRaw: currency === 'NGN' ? 900 : 1.5, 
        label: 'The Cram Session',
        desc: "Emergency top-up."
      },
      { 
        amount: 1000, 
        price: currency === 'NGN' ? '₦2,500' : '$3.99', 
        priceRaw: currency === 'NGN' ? 2500 : 3.99, 
        label: 'Finals Week', 
        popular: true,
        desc: "Best for intense study blocks."
      },
      { 
        amount: 2500, 
        price: currency === 'NGN' ? '₦5,500' : '$8.99', 
        priceRaw: currency === 'NGN' ? 5500 : 8.99, 
        label: 'Semester Pack',
        desc: "Bulk savings for the long haul."
      }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#050505]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up-fade">
        {/* Header */}
        <div className="p-8 pb-0 text-center relative z-10">
           <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full p-2">✕</button>
           <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300">Economy</span></h2>
           <p className="text-gray-400 max-w-xl mx-auto text-sm">Manage your academic resources.</p>
           
           {/* Tab Switcher */}
           <div className="flex justify-center mt-8 mb-6">
               <div className="bg-white/5 p-1 rounded-full border border-white/10 flex">
                   <button onClick={() => setActiveTab('CREDITS')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'CREDITS' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>Top Up</button>
                   <button onClick={() => setActiveTab('SUBSCRIPTION')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'SUBSCRIPTION' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>Plan</button>
                   <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>History</button>
               </div>
           </div>
        </div>

        <div className="overflow-y-auto p-8 custom-scrollbar">
           
           {/* CREDIT PACKS */}
           {activeTab === 'CREDITS' && (
               <div className="max-w-4xl mx-auto">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {creditPacks.map((pack, i) => (
                           <div key={i} className={`p-6 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden flex flex-col items-center text-center ${pack.popular ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : ''}`}>
                               {pack.popular && <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-bold uppercase px-3 py-1 rounded-bl-xl">Best Value</div>}
                               <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">💎</div>
                               <h3 className="text-2xl font-black text-white font-mono">{pack.amount} NT</h3>
                               <p className="text-xs text-white font-bold uppercase tracking-widest mb-1">{pack.label}</p>
                               <p className="text-[10px] text-gray-400 mb-6">{pack.desc}</p>
                               <button 
                                onClick={() => handleBuyCredits(pack)}
                                disabled={processingPack !== null}
                                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${processingPack === pack.amount ? 'bg-gray-600 text-gray-300 cursor-wait' : 'bg-white text-black hover:bg-gray-200'}`}
                               >
                                   {processingPack === pack.amount ? 'Processing...' : `Buy for ${pack.price}`}
                               </button>
                           </div>
                       ))}
                   </div>
                   
                   {/* Upsell Message */}
                   <div className="mt-8 p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                       <div className="text-left">
                           <h4 className="text-white font-bold text-sm">Need consistent power?</h4>
                           <p className="text-xs text-gray-400">The Scholar plan gives you <span className="text-blue-400 font-bold">1,500 credits</span> for just <span className="text-white font-bold">{currency === 'NGN' ? '₦2,900' : '$4.99'}</span>. That's 50% more value than packs.</p>
                       </div>
                       <button onClick={() => setActiveTab('SUBSCRIPTION')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0">View Plans</button>
                   </div>

                   <p className="text-center text-[10px] text-gray-500 mt-6 uppercase tracking-widest">
                       1 Credit = 1 Chat Message • 10 Credits = 1 Exam • 15 Credits = 1 Lecture
                   </p>
               </div>
           )}

           {/* SUBSCRIPTIONS / MANAGEMENT */}
           {activeTab === 'SUBSCRIPTION' && (
               <>
               {/* Show Management UI if already premium */}
               {currentTier !== 'Fresher' ? (
                   <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 text-center animate-fade-in">
                       <h3 className="text-2xl font-bold text-white mb-2 font-display">Active Plan: <span className="text-amber-500">{currentTier}</span></h3>
                       <p className="text-gray-400 text-sm mb-8">Your neural interface is fully operational.</p>
                       
                       <div className="grid grid-cols-2 gap-4 mb-8">
                           <div className="bg-black/20 p-4 rounded-xl">
                               <p className="text-[10px] uppercase text-gray-500 font-bold">Status</p>
                               <p className="text-green-400 font-mono font-bold">ACTIVE</p>
                           </div>
                           <div className="bg-black/20 p-4 rounded-xl">
                               <p className="text-[10px] uppercase text-gray-500 font-bold">Renewal</p>
                               <p className="text-white font-mono font-bold">Auto-Renewing</p>
                           </div>
                       </div>

                       <div className="space-y-4">
                           <button onClick={() => onClose()} className="w-full py-3 bg-white text-black rounded-xl font-bold uppercase text-xs">Return to App</button>
                           <button onClick={handleCancelSub} className="w-full py-3 bg-red-900/20 text-red-500 border border-red-500/20 rounded-xl font-bold uppercase text-xs hover:bg-red-900/40 transition-colors">Cancel Subscription</button>
                       </div>
                   </div>
               ) : (
                   /* Show Upgrade Options */
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch animate-fade-in">
                      {tiers.map((tier) => (
                        <div key={tier.id} className={`p-8 rounded-3xl border flex flex-col transition-all duration-300 group hover:-translate-y-2 ${tier.style}`}>
                           {tier.tag && (
                             <div className={`absolute top-0 right-0 ${tier.tagColor} text-[10px] font-bold uppercase px-4 py-1 rounded-bl-xl shadow-lg tracking-widest`}>
                               {tier.tag}
                             </div>
                           )}
                           <h4 className={`text-2xl font-bold mb-2 ${tier.id === 'Excellentia' ? 'text-amber-400 font-display' : 'text-white'}`}>{tier.name}</h4>
                           <p className="text-xs text-gray-400 mb-6 italic min-h-[20px]">"{tier.desc}"</p>
                           <div className="mb-8">
                               <div className="flex items-baseline gap-1">
                                   <span className={`text-4xl font-mono font-bold ${tier.id === 'Excellentia' ? 'text-white' : 'text-white'}`}>{tier.price}</span>
                                   <span className="text-xs text-gray-500">{tier.period}</span>
                               </div>
                               {tier.savings && (
                                   <div className="text-xs text-green-400 font-bold mt-1 animate-pulse">{tier.savings}</div>
                               )}
                           </div>
                           <ul className="space-y-4 mb-8 flex-1">
                             {tier.features.map(f => (
                               <li key={f} className="flex items-start gap-3 text-sm">
                                 <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${tier.id === 'Excellentia' ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                 </div>
                                 <span className={tier.id === 'Excellentia' ? 'text-gray-200' : 'text-gray-400'}>{f}</span>
                               </li>
                             ))}
                           </ul>
                           <button 
                             onClick={() => onUpgrade(tier.id, billingCycle)}
                             className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all ${tier.btnStyle} ${currentTier === tier.id ? 'opacity-50 cursor-default' : ''}`}
                           >
                             {currentTier === tier.id ? 'Current Plan' : tier.price === 'Free' ? 'Current Plan' : 'Select Plan'}
                           </button>
                        </div>
                      ))}
                   </div>
               )}
               </>
           )}

           {/* TRANSACTION HISTORY */}
           {activeTab === 'HISTORY' && (
               <div className="max-w-4xl mx-auto">
                   {loadingHistory ? (
                       <div className="text-center p-10 text-gray-500 animate-pulse">Retrieving Ledger...</div>
                   ) : history.length === 0 ? (
                       <div className="text-center p-10 text-gray-500">No transactions recorded.</div>
                   ) : (
                       <div className="space-y-2">
                           {history.map((item, i) => (
                               <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                   <div>
                                       <p className="text-xs font-bold text-white uppercase tracking-wider">{item.type === 'PAYMENT' ? 'Billing Charge' : 'Neural Usage'}</p>
                                       <p className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                                       <p className="text-xs text-gray-400 mt-1">{item.description || item.reference || 'Automated Action'}</p>
                                   </div>
                                   <div className="text-right">
                                       <p className={`font-mono font-bold ${item.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                           {item.amount > 0 ? '+' : ''}{item.amount} {item.type === 'PAYMENT' ? 'USD/NGN' : 'NT'}
                                       </p>
                                       <span className={`text-[9px] px-2 py-0.5 rounded uppercase ${item.status === 'success' || item.type === 'GENERATION' ? 'bg-green-900/20 text-green-500' : 'bg-gray-800 text-gray-500'}`}>
                                           {item.status || 'Completed'}
                                       </span>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
