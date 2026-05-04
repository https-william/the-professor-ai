import { Ghost, X } from "lucide-react";
import StandardContainer from "@/components/ui/StandardContainer";

export default function PainSection() {
  return (
    <section className="relative w-full py-20 md:py-28 px-5 md:px-6 z-10 bg-[var(--background)]">
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: "radial-gradient(circle at 50% 0%, rgba(239,68,68,0.08) 0%, rgba(245,158,11,0.03) 60%, transparent 80%)",
      }} />

      <StandardContainer narrow className="text-center">
        <Ghost className="w-12 h-12 text-[#EF4444]/60 mx-auto mb-6 animate-pulse" />
        
        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)]/90 mb-6 tracking-tight leading-[1.1]">
          You are working way too hard <br className="hidden md:block" />
          for a <span className="text-[#EF4444]">B-</span>.
        </h2>
        
        <p className="text-base md:text-xl text-[var(--foreground-muted)] leading-relaxed max-w-2xl mx-auto font-medium">
          Let's be honest: reading through a 500-page lecture slide at 3 AM the night before your exam isn't studying. It's just panic.
        </p>

        <div className="grid grid-cols-1 gap-8 mt-16 max-w-3xl mx-auto text-left">
          {[
            { pain: "Endless Highlighting", desc: "Painting your textbook neon yellow doesn't actually put the info in your brain." },
            { pain: "Lecture Panic", desc: "Rewatching 4-hour lectures on 2x speed hoping you absorb it by osmosis." },
            { pain: "Blind Confidence", desc: "Walking into an exam feeling 'ready' only to blank on question 1." }
          ].map((item, i) => (
            <div key={i} className="flex flex-col text-left group p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/30 hover:bg-[var(--card)]/50 transition-all duration-500">
              <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#EF4444]/20 transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)">
                <X size={20} strokeWidth={2} className="text-[#EF4444]" />
              </div>
              <h3 className="text-[var(--foreground)] font-heading text-xl font-bold mb-3 tracking-tight">{item.pain}</h3>
              <p className="text-base text-[var(--foreground-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </StandardContainer>
    </section>
  );
}

