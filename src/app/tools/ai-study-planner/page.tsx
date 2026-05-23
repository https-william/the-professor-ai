"use client";

import { useState } from "react";
import { Calendar, Clock, Target, Zap, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const dayOptions = [
    { id: "7", label: "7 Days", desc: "Emergency Pace", emoji: "🚨" },
    { id: "14", label: "14 Days", desc: "Intensive Study", emoji: "🔥" },
    { id: "30", label: "30 Days", desc: "Standard Pace", emoji: "📅" },
    { id: "90", label: "90 Days", desc: "Elite Mastery", emoji: "🏆" },
];

export default function AIStudyPlanner() {
  const [exam, setExam] = useState("");
  const [days, setDays] = useState("30");
  const [intensity, setIntensity] = useState("Balanced");
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = () => {
    setLoading(true);
    // Simulate AI generation
    setTimeout(() => {
      const generatedPlan = {
        title: `Smart Study Plan: ${exam}`,
        phases: [
          { name: "Phase 1: Knowledge Mapping", focus: "Identify blind spots and map the syllabus logic.", duration: "Days 1-7" },
          { name: "Phase 2: Neural Compression", focus: "Active recall sprints and high-fidelity summarization.", duration: "Days 8-21" },
          { name: "Phase 3: Simulation Practice", focus: "Full-length exam simulations under timed pressure.", duration: "Days 22-30" }
        ],
        verdict: "This plan is optimized for the 'Professor Recall Loop'. High-intensity retrieval is required."
      };
      setPlan(generatedPlan);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--foreground)] pt-28 pb-24 relative overflow-hidden flex flex-col flex-1">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--blue-glow)] opacity-[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--blue-glow)] opacity-[0.02] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 w-full relative z-10 flex-1 flex flex-col justify-center">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-[0.9]">
            AI Study <span className="text-[var(--blue)]">Planner</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--foreground-muted)] max-w-xl mx-auto font-bold leading-relaxed opacity-70">
            Stop &apos;reading&apos; your syllabus. Start understanding it. Our AI builds a custom plan tailored specifically for your target exam.
          </p>
        </div>

        {!plan ? (
          <div className="p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl shadow-2xl space-y-8">
            <div className="space-y-6">
              
              {/* Field 1: Which exam */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-[var(--foreground)] opacity-35 uppercase tracking-[0.25em]">Which exam are you acing?</label>
                <div className="relative flex items-center group">
                  <BookOpen className="absolute left-5 w-5 h-5 text-[var(--foreground-muted)] opacity-30 group-focus-within:text-[var(--blue-text)] group-focus-within:opacity-100 transition-all duration-300" />
                  <input 
                    type="text" 
                    placeholder="e.g. JAMB UTME, MCAT, SAT, Finals..." 
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    className="w-full bg-[var(--bg-3)]/60 border border-[var(--border)] rounded-2xl pl-14 pr-5 py-4.5 text-base font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 focus:border-[var(--blue)]/40 focus:shadow-[0_0_25px_rgba(37,99,235,0.08)] focus:bg-[var(--bg-4)]/80 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Field 2 & 3: Days Remaining & Intensity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Custom Days Grid */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[var(--foreground)] opacity-35 uppercase tracking-[0.25em]">Days remaining?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {dayOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setDays(opt.id)}
                        className={cn(
                          "p-3.5 text-left rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-20 active:scale-[0.97]",
                          days === opt.id 
                            ? 'bg-[var(--blue)]/5 border-[var(--blue)]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] scale-[1.01]' 
                            : 'bg-[var(--bg-3)]/60 border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                        )}
                      >
                        <div className={cn("text-[11px] font-black flex items-center gap-1.5", days === opt.id ? 'text-[var(--blue-text)]' : 'text-[var(--foreground)]')}>
                          <span>{opt.emoji}</span> {opt.label}
                        </div>
                        <p className="text-[9px] text-[var(--foreground-muted)] opacity-60 font-bold leading-snug">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity selector */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[var(--foreground)] opacity-35 uppercase tracking-[0.25em]">Intensity?</label>
                  <div className="flex flex-col gap-3 h-[10.5rem] justify-between">
                    {[
                      { level: "Balanced", color: "var(--emerald)", label: "Balanced Progress" },
                      { level: "High", color: "var(--blue)", label: "Intensive Recall" },
                      { level: "Insane", color: "var(--crimson)", label: "Insane Sprint Mode" }
                    ].map((item) => (
                      <button 
                        key={item.level}
                        onClick={() => setIntensity(item.level)}
                        className={cn(
                          "w-full py-3.5 rounded-2xl border transition-all font-black text-xs uppercase tracking-widest cursor-pointer flex items-center justify-between px-5 active:scale-[0.98]",
                          intensity === item.level 
                            ? 'text-white border-transparent shadow-md scale-[1.01]' 
                            : 'bg-[var(--bg-3)]/60 border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                        )}
                        style={intensity === item.level ? {
                          backgroundColor: item.color,
                          boxShadow: `0 8px 16px -4px ${item.color}66`
                        } : undefined}
                      >
                        <span>{item.level}</span>
                        <span className="text-[9px] opacity-70 font-mono font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                onClick={generatePlan}
                disabled={!exam || loading}
                className={cn(
                  "w-full py-5 rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg cursor-pointer",
                  (!exam || loading)
                    ? 'opacity-65 cursor-not-allowed bg-[var(--bg-3)] border border-[var(--border)] text-[var(--foreground-muted)]/30' 
                    : 'bg-[var(--foreground)] text-[var(--background)] hover-scale-sm active:scale-[0.98]'
                )}
              >
                {exam && !loading && (
                  <>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  </>
                )}
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Strategizing...
                  </span>
                ) : (
                  <>
                    Generate Study Plan 
                    <Zap size={16} strokeWidth={2.5} className="animate-pulse" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in duration-500">
            
            {/* Generated Plan Stepper Card */}
            <div className="p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-[var(--border)] bg-[var(--card)] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--blue-glow)] opacity-[0.03] rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <h2 className="text-xl sm:text-2xl font-black mb-8 flex items-center gap-3 text-[var(--foreground)]">
                 <Target className="w-6 h-6 text-[var(--blue)] shrink-0 animate-pulse" /> 
                 <span className="tracking-tight">{plan.title}</span>
              </h2>

              <div className="space-y-1">
                {plan.phases.map((phase: any, i: number) => {
                  const getPhaseStyles = (index: number) => {
                    switch(index) {
                      case 0: return "text-[var(--emerald-text)] bg-[var(--emerald-dim)] border-[var(--emerald-border)]";
                      case 1: return "text-[var(--blue-text)] bg-[var(--blue-dim)] border-[var(--blue-border)]";
                      default: return "text-[var(--cyan-text)] bg-[var(--cyan-dim)] border-[var(--cyan-border)]";
                    }
                  };
                  return (
                    <div key={i} className="relative pl-8 pb-8 last:pb-0 border-l border-[var(--border-2)] last:border-transparent">
                      <div className="absolute top-1.5 -left-[6.5px] w-3 h-3 rounded-full bg-[var(--blue)] border-2 border-[var(--bg)] shadow-[0_0_12px_var(--blue)]" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h4 className="text-[16px] font-black text-[var(--foreground)] leading-tight">{phase.name}</h4>
                        <span className={cn("px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border w-fit shrink-0", getPhaseStyles(i))}>
                          {phase.duration}
                        </span>
                      </div>
                      <p className="text-[12px] text-[var(--foreground-muted)] font-bold leading-relaxed opacity-85">{phase.focus}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-5 rounded-2xl bg-[var(--bg-3)]/60 border border-[var(--border)] italic text-[12px] text-[var(--foreground-muted)] font-bold leading-relaxed">
                 &ldquo;{plan.verdict}&rdquo;
              </div>
            </div>

            {/* Access Callout Ticket Card */}
            <div className="p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-[var(--bg-2)] to-[var(--bg-3)] border border-[var(--border)] text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--blue-glow)] opacity-[0.04] rounded-full blur-3xl pointer-events-none" />
              <h3 className="text-xl sm:text-2xl font-black mb-3 tracking-tight text-[var(--foreground)] uppercase">WANT THE FULL DAILY SCHEDULE?</h3>
              <p className="text-[12px] text-[var(--foreground-muted)] opacity-60 mb-6 max-w-sm mx-auto font-bold leading-relaxed">
                Join 50,000+ students using The Professor to automate their academic planning and active recall tracking.
              </p>
              <Link href="/signup" className="inline-flex items-center justify-center px-10 py-4.5 rounded-full bg-[var(--text)] text-[var(--background)] font-black text-xs uppercase tracking-[0.2em] shadow-md hover-scale-md active:scale-95 transition-all">
                Access Full Plan
              </Link>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <section className="mt-20 pt-20 border-t border-[var(--border)]">
           <h2 className="text-2xl font-black mb-12 text-center tracking-tight">Why use an AI Study Planner?</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 rounded-[28px] bg-[var(--card)]/40 border border-[var(--border)] hover-lift-md hover:border-[var(--blue)]/30 transition-all duration-300 shadow-sm flex flex-col h-full">
                 <div className="w-10 h-10 rounded-xl bg-[var(--emerald-dim)] border border-[var(--emerald-border)] flex items-center justify-center mb-5 shrink-0">
                   <Calendar className="w-5 h-5 text-[var(--emerald-text)]" />
                 </div>
                 <h4 className="text-[15px] font-black text-[var(--foreground)] mb-2">Automated Pacing</h4>
                 <p className="text-[12px] text-[var(--foreground-muted)] opacity-60 leading-relaxed font-bold">Never fall behind. The AI adjusts your schedule based on your actual daily study progress.</p>
              </div>

              <div className="p-6 rounded-[28px] bg-[var(--card)]/40 border border-[var(--border)] hover-lift-md hover:border-[var(--blue)]/30 transition-all duration-300 shadow-sm flex flex-col h-full">
                 <div className="w-10 h-10 rounded-xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center mb-5 shrink-0">
                   <Clock className="w-5 h-5 text-[var(--blue-text)]" />
                 </div>
                 <h4 className="text-[15px] font-black text-[var(--foreground)] mb-2">Focus Optimization</h4>
                 <p className="text-[12px] text-[var(--foreground-muted)] opacity-60 leading-relaxed font-bold">Spend time on what actually matters. We prioritize the high-yield sections of your notes.</p>
              </div>

              <div className="p-6 rounded-[28px] bg-[var(--card)]/40 border border-[var(--border)] hover-lift-md hover:border-[var(--blue)]/30 transition-all duration-300 shadow-sm flex flex-col h-full">
                 <div className="w-10 h-10 rounded-xl bg-[var(--violet-dim)] border border-[var(--violet-border)] flex items-center justify-center mb-5 shrink-0">
                   <BookOpen className="w-5 h-5 text-[var(--violet-text)]" />
                 </div>
                 <h4 className="text-[15px] font-black text-[var(--foreground)] mb-2">Integrated Recall</h4>
                 <p className="text-[12px] text-[var(--foreground-muted)] opacity-60 leading-relaxed font-bold">Built-in active recall review cycles based on standard spaced repetition frequencies.</p>
              </div>

           </div>
        </section>
      </div>
    </div>
  );
}
