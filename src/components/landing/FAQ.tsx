"use client";
import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StandardContainer from "@/components/ui/StandardContainer";

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      q: "How long does it take to extract flashcards from a 200-page textbook?",
      a: "Less than 60 seconds. Our neural engine processes massive documents almost instantly, allowing you to start studying immediately instead of waiting.",
      popular: true
    },
    {
      q: "Will my professor know I used this?",
      a: "The Professor generates strategic study tools to help YOU learn the material, not write essays for you. It's a high-fidelity study aid, not a shortcut. Since it only quizzes you on facts from your own syllabus, it is the ultimate tool for achieving independent mastery.",
      popular: true
    },
    {
      q: "Can I upload my lecturer's messy and scanned PDF notes?",
      a: "Yes. The Professor uses advanced document parsing that can read scanned PDFs, messy PowerPoints, and dense Word documents flawlessly, extracting only the exact syllabus requirements.",
      popular: false
    },
    {
      q: "I'm a broke student. Can I actually afford this?",
      a: "Yes. There are no sneaky $20/month subscriptions. We use a transparent Pay-As-You-Go credit system. ₦500 gets you hundreds of decks. You only pay for the exact compute power you use to generate your materials.",
      popular: false
    },
    {
      q: "Is my uploaded data private?",
      a: "Absolutely. Your uploads are processed instantly and are never used to train our base AI models. Your files are siloed securely so only you have access to your institutional materials.",
      popular: false
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="relative w-full py-20 px-5 md:px-6 z-10 bg-[var(--background)]">
      <StandardContainer narrow>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center text-[var(--foreground)] mb-8">
          You've got questions.
        </h2>

        {/* Search Bar */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Search frequently asked questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredFaqs.map((faq, i) => {
            const originalIndex = faqs.findIndex(f => f.q === faq.q);
            return (
              <div 
                key={originalIndex} 
                className={`rounded-2xl transition-colors ${openIdx === originalIndex ? 'bg-[var(--background-secondary)] border border-[var(--accent)]/30' : 'bg-transparent border border-[var(--border)] hover:bg-[var(--background-secondary)]/50'}`}
              >
                <button
                  className="w-full text-left px-6 py-5 flex items-start justify-between focus:outline-none min-h-[60px]"
                  onClick={() => setOpenIdx(openIdx === originalIndex ? null : originalIndex)}
                >
                  <div className="flex items-start gap-3 pr-4">
                    {faq.popular && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 shrink-0 mt-0.5">
                        Popular
                      </span>
                    )}
                    <span className={`font-bold text-sm md:text-base ${openIdx === originalIndex ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/80'}`}>
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown size={20} strokeWidth={1.5} className={`transition-transform duration-300 shrink-0 mt-0.5 ${openIdx === originalIndex ? 'rotate-180 text-[var(--accent)]' : 'text-[var(--foreground)]/40'}`} />
                </button>
                
                <AnimatePresence>
                  {openIdx === originalIndex && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 text-[13px] md:text-sm text-[var(--foreground-secondary)] leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </StandardContainer>
    </section>
  );
}

