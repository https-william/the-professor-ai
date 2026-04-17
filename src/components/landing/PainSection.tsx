import { Ghost, X } from "lucide-react";

export default function PainSection() {
  return (
    <section className="relative w-full py-20 md:py-28 px-5 md:px-6 z-10 bg-[#06060B]">
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: "radial-gradient(circle at 50% 0%, rgba(239,68,68,0.03) 0%, transparent 60%)",
      }} />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <Ghost className="w-12 h-12 text-[#EF4444]/60 mx-auto mb-6 animate-pulse" />
        
        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white/90 mb-6 tracking-tight leading-[1.1]">
          You are working way too hard <br className="hidden md:block" />
          for a <span className="text-[#EF4444]">B-</span>.
        </h2>
        
        <p className="text-base md:text-xl text-white/40 leading-relaxed max-w-2xl mx-auto font-medium">
          Let's be honest: reading through a 500-page lecture slide at 3 AM the night before your exam isn't studying. It's just panic.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto text-left">
          {[
            { pain: "Endless Highlighting", desc: "Painting your textbook neon yellow doesn't actually put the info in your brain." },
            { pain: "Lecture Panic", desc: "Rewatching 4-hour lectures on 2x speed hoping you absorb it by osmosis." },
            { pain: "Blind Confidence", desc: "Walking into an exam feeling 'ready' only to blank on question 1." }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <X size={16} strokeWidth={1.5} className="text-[#EF4444]/50 mb-3 block" />
              <h4 className="text-white/80 font-bold mb-2 text-sm">{item.pain}</h4>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
