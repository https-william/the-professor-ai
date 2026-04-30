import { Star } from "lucide-react";
import StandardContainer from "@/components/ui/StandardContainer";

export default function Testimonials() {
  const testimonials = [
    {
      quote: "I uploaded my Anatomy slide deck, and it generated 45 flashcards focusing exactly on what the lecturer emphasized. It basically cemented an A for me.",
      name: "Chukwudi N.",
      school: "University of Lagos (UNILAG)",
      image: "CN"
    },
    {
      quote: "Saved me 10 hours of manual outlining this semester. The quiz engine points out exactly what gaps I have before my CA.",
      name: "Damola F.",
      school: "Covenant University",
      image: "DF"
    },
    {
      quote: "The Professor summarized my entire Law syllabus in 10 minutes. Breaking down complex legal jargon into simple concepts saved my life.",
      name: "Aisha B.",
      school: "Ahmadu Bello University",
      image: "AB"
    }
  ];

  return (
    <section className="relative w-full py-20 px-5 md:px-6 z-10 bg-[var(--background-secondary)]">
      <StandardContainer>
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-center text-[var(--foreground)] mb-12">
          Don't just take our word for it.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="flex gap-1 mb-4 text-[#F59E0B]">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-[var(--foreground)] font-medium text-sm leading-relaxed mb-8 italic">
                  "{t.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs ring-1 ring-[var(--accent)]/30">
                  {t.image}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--foreground)]">{t.name}</h4>
                  <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest">{t.school}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </StandardContainer>
    </section>
  );
}

