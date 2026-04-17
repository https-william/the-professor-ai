import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function LandingPricing() {
  const plans = [
    {
      name: "Student Stash",
      price: "₦500",
      credits: "500",
      target: "For casual studying",
      popular: false,
      color: "var(--accent)",
      features: ["100 Flashcard Decks", "100 Quizzes", "Standard Support"]
    },
    {
      name: "Scholar Stack",
      price: "₦1,000",
      credits: "1200",
      target: "Best Value",
      popular: true,
      color: "var(--success)",
      features: ["240 Flashcard Decks", "240 Quizzes", "Best Value", "Faster Generation"]
    },
    {
      name: "Professor's Grant",
      price: "₦2,000",
      credits: "3000",
      target: "For the entire semester",
      popular: false,
      color: "var(--secondary)",
      features: ["600 Flashcard Decks", "600 Quizzes", "Priority Processing", "Exclusive AI Models"]
    }
  ];

  return (
    <section id="pricing" className="relative w-full py-20 md:py-28 px-5 md:px-6 z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
            Invest in your GPA.
          </h2>
          <p className="text-[var(--foreground-muted)] max-w-lg mx-auto">
            Transparent, pay-as-you-go pricing based on compute. No hidden monthly subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`relative p-8 rounded-[40px] border flex flex-col bg-[var(--card)] ${plan.popular ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/30 -translate-y-2' : 'border-white/10'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full z-10 w-max">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">{plan.name}</h3>
              <p className="text-xs text-[var(--foreground-muted)] mb-6">{plan.target}</p>
              
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-[var(--foreground)]">{plan.price}</span>
                <span className="text-sm font-medium text-[var(--foreground-muted)]">/ {plan.credits} Units</span>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-[var(--foreground-secondary)] items-start">
                    <CheckCircle2 size={20} strokeWidth={1.5} className="w-5 h-5 shrink-0" style={{ color: plan.color }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                href="/signup" 
                className={`w-full py-4 flex items-center justify-center rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                  plan.popular 
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg' 
                  : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                Get {plan.credits} Credits
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
