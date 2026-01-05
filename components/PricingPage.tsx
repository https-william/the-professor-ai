
import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';

interface PricingPageProps {
  onBack: () => void;
  onSignUp: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack, onSignUp }) => {
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');

  useEffect(() => {
    // STRICT GEO-FENCING
    // Default is USD. Only switch to NGN if explicitly in Nigeria.
    // This prevents international arbitrage.
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === 'Africa/Lagos') {
            setCurrency('NGN');
        }
    } catch (e) {
        // Fallback to USD on error
        setCurrency('USD');
    }
  }, []);

  const plans = [
      {
          name: "Fresher",
          price: "Free",
          desc: "The sampler pack.",
          features: [
              "1 Quiz / Day", 
              "1 File Upload / Day", 
              "Standard Queue", 
              "No Professor Chat"
          ],
          cta: "Start Free",
          popular: false,
          color: "border-white/10"
      },
      {
          name: "Scholar",
          price: currency === 'NGN' ? '₦3,500' : '$8.99',
          period: '/mo',
          desc: "For the serious student.",
          features: [
              "Unlimited Quizzes", 
              "Feynman Tutor (Chat)", 
              "10 Files / Day", 
              "Priority Processing", 
              "War Room Access"
          ],
          cta: "Enroll Now",
          popular: true,
          color: "border-blue-500/50 bg-blue-900/5"
      },
      {
          name: "Excellentia",
          price: currency === 'NGN' ? '₦8,000' : '$19.99',
          period: '/mo',
          desc: "Academic immortality.",
          features: [
              "Unlimited Everything", 
              "Nightmare Difficulty", 
              "The Oracle (Predictive AI)", 
              "Weakness Destroyer", 
              "Admin-Level Support"
          ],
          cta: "Go Ultimate",
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
                    <span className="font-serif font-bold text-lg hidden sm:block">The Professor</span>
                </div>
                <button onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                    ← Back to Home
                </button>
            </div>
        </nav>

        <div className="pt-32 pb-20 px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="text-amber-500 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Tuition & Fees</span>
                <h1 className="text-5xl md:text-7xl font-serif font-medium text-white mb-6">Invest in your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-200">Neural Upgrade.</span></h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                    Standard education gives you information. The Professor gives you mastery. <br/>
                    Choose the plan that fits your ambition.
                </p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                    <div key={idx} className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-300 group hover:-translate-y-2 ${plan.color}`}>
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-lg tracking-widest">
                                Recommended
                            </div>
                        )}
                        {plan.highlight && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-lg tracking-widest">
                                Best Value
                            </div>
                        )}

                        <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-amber-500 font-serif' : 'text-gray-200'}`}>{plan.name}</h3>
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

                        <button onClick={onSignUp} className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all ${plan.highlight ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white text-black hover:bg-gray-200'}`}>
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="max-w-4xl mx-auto mt-20 text-center border-t border-white/5 pt-10">
                <h3 className="text-xl font-bold text-white mb-4">Enterprise Licenses</h3>
                <p className="text-gray-400 mb-6">Want to deploy The Professor for your entire organization or university?</p>
                <a href="mailto:vexis.automations@gmail.com" className="inline-block px-8 py-3 border border-white/20 hover:bg-white/10 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all">Contact Sales</a>
            </div>
        </div>
    </div>
  );
};
