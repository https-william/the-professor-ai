
import React, { useState, useEffect } from 'react';
import { SubscriptionTier } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
  userEmail?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentTier, onUpgrade }) => {
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('USD');

  useEffect(() => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === 'Africa/Lagos') {
            setCurrency('NGN');
        } else {
            setCurrency('USD');
        }
      } catch(e) { setCurrency('USD'); }
  }, []);

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'Fresher' as SubscriptionTier,
      name: 'The Fresher',
      priceDisplay: 'Free',
      amount: 0,
      desc: "The sampler pack.",
      features: [
        '1 Quiz / Day',
        '1 File Upload / Day',
        'Standard Queue',
        'No Professor Chat'
      ],
      style: 'bg-[#18181b] border-white/10 text-gray-400'
    },
    {
      id: 'Scholar' as SubscriptionTier,
      name: 'The Scholar',
      priceDisplay: currency === 'NGN' ? '₦2,900' : '$4.99',
      amount: currency === 'NGN' ? 2900 : 4.99,
      desc: "Less than a pizza. 100x the value.",
      features: [
        'Unlimited Quizzes',
        'Feynman Tutor (Chat)',
        '10 Files Upload / Day',
        'Priority Processing',
        'War Room Access'
      ],
      style: 'bg-blue-900/10 border-blue-500/50 relative overflow-hidden',
      tag: 'Best Value',
      tagColor: 'bg-blue-600'
    },
    {
      id: 'Excellentia' as SubscriptionTier, 
      name: 'Excellentia',
      priceDisplay: currency === 'NGN' ? '₦8,500' : '$14.99',
      amount: currency === 'NGN' ? 8500 : 14.99,
      desc: "Academic immortality.",
      features: [
        'Unlimited Everything',
        'Nightmare Difficulty',
        'The Oracle (Predictive AI)',
        'Weakness Destroyer',
        'Direct Admin Line'
      ],
      style: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2a2a2a] via-[#0f0f0f] to-black border-[#D4AF37]/60 shadow-[0_0_25px_rgba(212,175,55,0.15)]',
      tag: 'VIP ONLY',
      tagColor: 'bg-gradient-to-r from-[#D4AF37] to-[#B59410] text-black font-black tracking-widest'
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-[#050505] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up-fade">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
           <div className="flex items-center gap-3">
             <span className="text-2xl">🎓</span>
             <h2 className="text-xl font-bold text-white font-display">Tuition Plans</h2>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-2 p-2 bg-white/5 rounded-full">✕</button>
        </div>

        <div className="overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#050505]">
           <div className="text-center mb-12">
             <h3 className="text-3xl md:text-5xl font-display font-bold mb-4 text-white">Invest in your mind.</h3>
             <p className="text-gray-400 max-w-md mx-auto">The cost of ignorance is higher than the price of education.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
              {tiers.map((tier) => (
                <div 
                  key={tier.id} 
                  className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-300 group ${tier.style} ${currentTier === tier.id ? 'ring-2 ring-white/50' : ''}`}
                >
                   {tier.tag && (
                     <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${tier.tagColor} text-white text-[10px] font-bold uppercase px-4 py-1.5 rounded-full shadow-lg`}>
                       {tier.tag}
                     </div>
                   )}
                   
                   <h4 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${tier.id === 'Excellentia' ? 'text-[#D4AF37] font-display' : 'text-white'}`}>
                     {tier.name}
                   </h4>
                   
                   <div className="flex items-baseline gap-1 mb-1">
                       <span className={`text-4xl font-mono font-bold ${tier.id === 'Excellentia' ? 'text-white' : 'text-white'}`}>{tier.priceDisplay}</span>
                       {tier.amount > 0 && <span className="text-xs text-gray-500">/mo</span>}
                   </div>
                   
                   <p className="text-xs text-gray-500 mb-8 italic min-h-[32px]">"{tier.desc}"</p>

                   <ul className="space-y-4 mb-10 flex-1">
                     {tier.features.map(f => (
                       <li key={f} className="flex items-start gap-3 text-sm">
                         <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${tier.id === 'Excellentia' ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                         </div>
                         <span className={tier.id === 'Excellentia' ? 'text-gray-200' : 'text-gray-300'}>{f}</span>
                       </li>
                     ))}
                   </ul>

                   <button 
                     onClick={() => onUpgrade(tier.id)}
                     className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${
                       currentTier === tier.id 
                         ? 'bg-white/5 text-gray-500 cursor-default border border-white/5' 
                         : tier.id === 'Excellentia'
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C7323] text-black shadow-lg shadow-[#D4AF37]/20'
                            : tier.id === 'Scholar'
                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                                : 'bg-white text-black hover:bg-gray-200'
                     }`}
                   >
                     {currentTier === tier.id ? 'Current Plan' : tier.amount === 0 ? 'Downgrade' : 'Select Plan'}
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
