
import React, { useState, useEffect } from 'react';
import { SubscriptionTier } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier, billingCycle: string) => void;
  userEmail?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentTier, onUpgrade }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD');

  useEffect(() => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === 'Africa/Lagos') setCurrency('NGN');
      } catch(e) { setCurrency('USD'); }
  }, []);

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'Fresher' as SubscriptionTier,
      name: 'Fresher',
      price: 'Free',
      period: 'Forever',
      desc: "Basic access for casual study.",
      features: [
        '1 Quiz Generation / Day',
        '1 Document Upload / Day',
        'Standard Queue',
        'Community Support'
      ],
      style: 'bg-white/5 border-white/10 text-gray-400',
      btnStyle: 'bg-white/10 text-white hover:bg-white/20'
    },
    {
      id: 'Scholar' as SubscriptionTier,
      name: 'Scholar',
      price: billingCycle === 'monthly' 
          ? (currency === 'NGN' ? '₦2,900' : '$4.99') 
          : (currency === 'NGN' ? '₦29,000' : '$49.99'),
      period: billingCycle === 'monthly' ? '/mo' : '/yr',
      savings: billingCycle === 'annually' ? (currency === 'NGN' ? 'Save ₦5,800' : 'Save $10') : null,
      desc: "Serious tools for serious students.",
      features: [
        '10 Quizzes / Day',
        'Professor Chat (Standard)',
        '10 Document Uploads / Day',
        '30-Day History Retention',
        'Priority Processing'
      ],
      style: 'bg-blue-900/20 border-blue-500/30 text-blue-100 relative overflow-hidden',
      btnStyle: 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20',
      tag: 'Most Popular',
      tagColor: 'bg-blue-500'
    },
    {
      id: 'Excellentia' as SubscriptionTier, 
      name: 'Excellentia',
      price: billingCycle === 'monthly' 
          ? (currency === 'NGN' ? '₦8,500' : '$14.99') 
          : (currency === 'NGN' ? '₦85,000' : '$149.99'),
      period: billingCycle === 'monthly' ? '/mo' : '/yr',
      savings: billingCycle === 'annually' ? (currency === 'NGN' ? 'Save ₦17,000' : 'Save $30') : null,
      desc: "The ultimate academic weapon.",
      features: [
        'Unlimited Everything',
        'Professor Chat (Socratic Mode)',
        'The Oracle (Predictive Exams)',
        'War Room Analytics',
        'Lifetime History Vault',
        'Direct Admin Line (WhatsApp)'
      ],
      style: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)]',
      btnStyle: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold shadow-lg shadow-amber-500/30 hover:scale-105',
      tag: 'BEST VALUE',
      tagColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black'
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#050505]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up-fade">
        {/* Header */}
        <div className="p-8 pb-0 text-center relative z-10">
           <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full p-2">✕</button>
           <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Invest in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300">Future.</span></h2>
           <p className="text-gray-400 max-w-xl mx-auto text-sm">Unlock the full power of the Neural Engine. Choose the plan that fits your ambition.</p>
           
           {/* Toggle */}
           <div className="flex justify-center mt-8 mb-4">
               <div className="bg-white/5 p-1 rounded-full border border-white/10 flex relative">
                   <button 
                     onClick={() => setBillingCycle('monthly')}
                     className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all z-10 ${billingCycle === 'monthly' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                   >
                       Monthly
                   </button>
                   <button 
                     onClick={() => setBillingCycle('annually')}
                     className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all z-10 flex items-center gap-2 ${billingCycle === 'annually' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                   >
                       Annually
                       <span className="bg-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded border border-green-500/30">-20%</span>
                   </button>
                   
                   {/* Slider Background */}
                   <div className={`absolute top-1 bottom-1 w-[50%] bg-white rounded-full transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-[49%]'}`}></div>
               </div>
           </div>
        </div>

        <div className="overflow-y-auto p-8 custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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
        </div>
      </div>
    </div>
  );
};
