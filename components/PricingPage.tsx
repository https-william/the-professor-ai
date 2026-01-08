
import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { SubscriptionTier } from '../types';

interface PricingPageProps {
  onBack: () => void;
  onSelectPlan: (tier: SubscriptionTier) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack, onSelectPlan }) => {
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');

  useEffect(() => {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === 'Africa/Lagos') {
            setCurrency('NGN');
        }
    } catch (e) {
        setCurrency('USD');
    }
  }, []);

  const plans = [
      {
          id: 'Fresher' as SubscriptionTier,
          name: "Basic",
          price: "Free",
          desc: "Essential study tools.",
          features: [
              "1 Quiz / Day", 
              "1 File Upload / Day", 
              "Standard Speed", 
              "Read-Only Chat"
          ],
          cta: "Start Free",
          popular: false,
          color: "border-white/10"
      },
      {
          id: 'Scholar' as SubscriptionTier,
          name: "Pro",
          price: currency === 'NGN' ? '₦2,900' : '$4.99',
          period: '/mo',
          desc: "Advanced features for serious students.",
          features: [
              "Unlimited Quizzes", 
              "AI Tutor Access", 
              "10 File Uploads / Day", 
              "Priority Speed", 
              "Collaborative Study Rooms"
          ],
          cta: "Select Pro",
          popular: true,
          color: "border-blue-500/50 bg-blue-900/5"
      },
      {
          id: 'Excellentia' as SubscriptionTier,
          name: "Premium",
          price: currency === 'NGN' ? '₦8,500' : '$14.99',
          period: '/mo',
          desc: "Complete access to all capabilities.",
          features: [
              "No Usage Limits", 
              "Hardest Difficulty Unlocked", 
              "Predictive Questioning", 
              "Weakness Analysis", 
              "Priority Support"
          ],
          cta: "Select Premium",
          popular: false,
          highlight: true,
          color: "border-amber-500/50 bg-gradient-to-b from-amber-900/10 to-black"
      }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
        {/* Nav */}
        <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 py-4">
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
                    <div className="w-8 h-8"><BrandLogo /></div>
                    <span className="font-display font-bold text-lg hidden sm:block">The Professor</span>
                </div>
                <button onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                    ← Back to Home
                </button>
            </div>
        </nav>

        <div className="pt-32 pb-20 px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="text-amber-500 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Tuition</span>
                <h1 className="text-5xl md:text-7xl font-display font-medium text-white mb-6">Simple, transparent pricing.</h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                    Choose the plan that fits your academic needs. Cancel anytime.
                </p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                    <div key={idx} className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-300 group hover:-translate-y-2 ${plan.color}`}>
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-lg tracking-widest">
                                Most Popular
                            </div>
                        )}
                        {plan.highlight && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-lg tracking-widest">
                                Best Value
                            </div>
                        )}

                        <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-amber-500 font-display' : 'text-gray-200'}`}>{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-5xl font-mono font-bold text-white">{plan.price}</span>
                            {plan.period && <span className="text-xs text-gray-500">{plan.period}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mb-8 h-8 uppercase tracking-wider">{plan.desc}</p>

                        <div className="w-full h-px bg-white/10 mb-8"></div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feat, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                    <span className={`text-lg leading-none ${plan.highlight ? 'text-amber-500' : 'text-blue-500'}`}>✓</span>
                                    <span className="text-gray-300">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <button onClick={() => onSelectPlan(plan.id)} className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all ${plan.highlight ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white text-black hover:bg-gray-200'}`}>
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
