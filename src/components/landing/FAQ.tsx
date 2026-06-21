"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "What file types can I upload?",
    a: "PDF documents, PowerPoint slides (.pptx), Word files (.docx), and images (JPG, PNG, WEBP) — including photos of handwritten notes. If your notes exist in any readable format, The Professor can work with them. Yes, this includes WhatsApp-forwarded lecture slides.",
  },
  {
    q: "Do I need to create an account before I start?",
    a: "No. You can upload your notes and receive a preview of your study guide before creating an account. Creating a free account saves your study pack, enables streaks, and gives you access to the quiz and match game. The first generation is always free.",
  },
  {
    q: "How accurate are the study guides and quizzes?",
    a: "The Professor extracts content directly from your uploaded material — it does not hallucinate or add external information. The study guide and quiz reflect exactly what is in your notes. If your notes contain an error, the output will too. We recommend using it alongside, not instead of, your own judgment.",
  },
  {
    q: "Is this considered academic dishonesty?",
    a: "No. The Professor is a study aid — equivalent to highlighting your notes, making flashcards, or studying with a tutor. It helps you understand and recall your own material. It does not write essays, generate assignments, or produce work for submission. How you use what you learn is always your responsibility.",
  },
  {
    q: "How much does it cost?",
    a: "The Professor is free for students. Our mission is to democratize elite study strategies, ensuring every scholar has access to the best AI tools regardless of their budget. Unlimited uploads, active recall sets, and study analytics are all part of the core experience.",
  },
  {
    q: "Does it work for science, engineering, and medical courses?",
    a: "Yes. The Professor works for any text-based lecture content — including medical anatomy, engineering theory, law, economics, and the sciences. It does not solve mathematical equations or generate chemical formulae, but it handles concept-heavy, definition-heavy, and theory-heavy content extremely well.",
  },
  {
    q: "What happens to my uploaded notes?",
    a: "Your uploaded files are used only to generate your study pack. They are stored securely and associated only with your account. We do not sell, share, or use your notes to train our models. You can delete any uploaded document from your account at any time.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? -1 : i);
  };

  return (
    <section className="w-full py-20 px-4 md:px-8 lg:px-12 bg-transparent max-w-4xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center flex flex-col items-center gap-3 max-w-2xl mx-auto mb-16">
        <h2 className="font-heading text-3xl md:text-5xl font-black text-[var(--foreground)] leading-none tracking-tight">
          Every question. <br />
          <span className="text-blue-500 text-shadow-[0_0_30px_rgba(59,130,246,0.15)]">Honest answers.</span>
        </h2>
      </div>

      {/* Accordion Container */}
      <div className="border border-[var(--border)] rounded-[32px] p-2 bg-[var(--card)] shadow-sm overflow-hidden flex flex-col gap-1.5">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`rounded-2xl transition-all duration-300 ${
                isOpen 
                  ? "bg-[var(--bg-2)] border border-[var(--border)]/40 shadow-sm" 
                  : "border-b border-[var(--border)]/40 last:border-b-0 hover:bg-[var(--bg-2)]/30"
              }`}
            >
              {/* Accordion Header Trigger */}
              <button
                onClick={() => toggle(i)}
                className="flex items-center justify-between w-full px-6 py-5 text-left active:scale-[0.99] transition-transform duration-200 select-none group"
              >
                <span className={`font-heading text-sm md:text-base font-black transition-colors duration-200 ${
                  isOpen ? "text-[var(--foreground)]" : "text-[var(--foreground-secondary)] group-hover:text-[var(--foreground)]"
                }`}>
                  {faq.q}
                </span>

                {/* Plus/X icon box */}
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0 ${
                    isOpen 
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400 rotate-135" 
                      : "bg-[var(--bg-3)] border-[var(--border)] text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]"
                  }`}
                >
                  <Plus size={16} />
                </div>
              </button>

              {/* Accordion Content Panel (Drawer) */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="font-sans text-xs md:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium px-6 pb-5 pt-1 opacity-85">
                  {faq.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
