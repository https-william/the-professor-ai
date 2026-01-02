
import React, { useState } from 'react';
import { SubscriptionTier } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentTier, onUpgrade }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStripeCheckout = (tierId: SubscriptionTier, price: number) => {
    setLoading(true);
    
    // Simulate Stripe Checkout Redirect
    // In a real app, this would call a backend to create a Stripe Session
    setTimeout(() => {
        const confirm = window.confirm("Redirecting to Stripe Secure Checkout...\n\n(Simulation: Click OK to complete payment)");
        if (confirm) {
            onUpgrade(tierId);
            alert("Payment Successful! Welcome to The Professor " + tierId + ".");
            onClose();
        }
        setLoading(false);
    }, 1500);
  };

  const tiers = [
    {
      id: 'Fresher' as SubscriptionTier,
      name: 'The Fresher',
      priceDisplay: 'Free',
      amount: 0,
      desc: "Just enough to pass.",
      features: [
        '3 Quizzes / Day',
        'Text Paste Only',
        'Basic Scoring',
        'Standard Speed'
      ],
      color: 'border-gray-700 bg-gray-800/50'
    },
    {
      id: 'Scholar' as SubscriptionTier,
      name: 'The Scholar',
      priceDisplay: '₦2,000',
      amount: 2000,
      desc: "For the 5.0 GPA chaser.",
      features: [
        'Unlimited Quizzes',
        'PDF & Image Uploads',
        'War Room (CBT Mode)',
        'Feynman Explanations',
        'Chat with Notes'
      ],
      color: 'border-blue-500 bg-blue-900/20 shadow-blue-500/20 shadow-2xl scale-105 z-10',
      highlight: true
    },
    {
      id: 'Excellentia Supreme' as SubscriptionTier,
      name: 'Excellentia Supreme',
      priceDisplay: '₦5,000',
      amount: 5000,
      desc: "Academic Immortality.",
      features: [
        'Nightmare Difficulty Unlocked',
        'The Oracle (Predictive AI)',
        'Weakness Destroyer',
        'Voice Mode',
        'Thesis Defense Protocol'
      ],
      color: 'border-amber-500 bg-amber-900/20 shadow-amber-500/20 shadow-2xl',
      badge: true
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#0a0a0a] w-full max-w-5xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up-fade">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
           <div className="flex items-center gap-3">
             <span className="text-2xl">🎓</span>
             <h2 className="text-xl font-bold text-white">Tuition Plans</h2>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto p-4 md:p-8 custom-scrollbar">
           <div className="text-center mb-10">
             <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">Invest in your mind.</h3>
             <p className="text-gray-400">Choose the level of academic rigor you can handle.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
              {tiers.map((tier) => (
                <div 
                  key={tier.id} 
                  className={`relative p-6 rounded-2xl border flex flex-col h-full transition-all ${tier.color} ${currentTier === tier.id ? 'ring-2 ring-white' : ''}`}
                >
                   {tier.highlight && (
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                       Recommended
                     </div>
                   )}
                   
                   {tier.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse">
                        GOD MODE
                      </div>
                   )}
                   
                   <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                     {tier.name}
                     {tier.badge && <span className="text-amber-500">👑</span>}
                   </h4>
                   <div className="flex items-baseline gap-2 mb-1">
                       <span className="text-2xl font-mono font-bold">{tier.priceDisplay}</span>
                       {tier.amount > 0 && <span className="text-xs text-gray-500">/mo</span>}
                   </div>
                   
                   <p className="text-xs text-gray-400 mb-6 italic">"{tier.desc}"</p>

                   <ul className="space-y-3 mb-8 flex-1">
                     {tier.features.map(f => (
                       <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                         {f}
                       </li>
                     ))}
                   </ul>

                   <button 
                     onClick={() => handleStripeCheckout(tier.id, tier.amount)}
                     disabled={loading}
                     className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                       currentTier === tier.id 
                         ? 'bg-white/10 text-gray-500 cursor-default' 
                         : 'bg-[#635BFF] text-white hover:bg-[#5349e0] shadow-lg'
                     }`}
                   >
                     {loading ? 'Redirecting...' : (currentTier === tier.id ? 'Current Plan' : (
                         <>
                            <span>Pay with</span>
                            <span className="font-black italic">Stripe</span>
                         </>
                     ))}
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
