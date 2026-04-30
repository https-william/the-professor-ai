"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StandardContainer from "@/components/ui/StandardContainer";

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How long does it take to extract flashcards from a 200-page textbook?",
      a: "Less than 60 seconds. Our neural engine processes massive documents almost instantly, allowing you to start studying immediately instead of waiting."
    },
    {
      q: "Will my professor know I used this?",
      a: "The Professor generates study tools to help YOU learn the material, not write essays for you. It's an aggressive study aid, not an essay generator. Since it only quizzes you on facts you provided, it's virtually indistinguishable from a highly organized, relentless study buddy."
    },
    {
      q: "Can I upload my lecturer's messy and scanned PDF notes?",
      a: "Yes. The Professor uses advanced document parsing that can read scanned PDFs, messy PowerPoints, and dense Word documents flawlessly, extracting only the exact syllabus requirements."
    },
    {
      q: "I'm a broke student. Can I actually afford this?",
      a: "Yes. There are no sneaky $20/month subscriptions. We use a transparent Pay-As-You-Go credit system. ₦500 gets you hundreds of decks. You only pay for the exact compute power you use to generate your materials."
    },
    {
      q: "Is my uploaded data private?",
      a: "Absolutely. Your uploads are processed instantly and are never used to train our base AI models. Your files are siloed securely so only you have access to your institutional materials."
    }
  ];

  return (
    <section className="relative w-full py-20 px-5 md:px-6 z-10 bg-[var(--background)]">
      <StandardContainer narrow>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center text-[var(--foreground)] mb-10">
          You've got questions.
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`rounded-2xl transition-colors ${openIdx === i ? 'bg-[var(--background-secondary)] border border-[var(--accent)]/30' : 'bg-transparent border border-[var(--border)] hover:bg-[var(--background-secondary)]/50'}`}
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className={`font-bold text-sm md:text-base pr-4 ${openIdx === i ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/80'}`}>
                  {faq.q}
                </span>
                <ChevronDown size={20} strokeWidth={1.5} className={`transition-transform duration-300 ${openIdx === i ? 'rotate-180 text-[var(--accent)]' : 'text-[var(--foreground)]/40'}`} />
              </button>
              
              <AnimatePresence>
                {openIdx === i && (
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
          ))}
        </div>
      </StandardContainer>
    </section>
  );
}

