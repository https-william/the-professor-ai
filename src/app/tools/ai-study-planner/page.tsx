"use client";

import { useState } from "react";
import { Calendar, Clock, Target, ArrowRight, Zap, BookOpen } from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen bg-[var(--background)] text-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">AI Study Planner</h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Stop 'reading' your syllabus. Start understanding it. Our AI builds a smart plan for your specific exam.
          </p>
        </div>

        {!plan ? (
          <div className="p-8 md:p-12 rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-xl">
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-3">Which exam are you acing?</label>
                <input 
                  type="text" 
                  placeholder="e.g. JAMB UTME, MCAT, SAT, Finals..." 
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-3">Days remaining?</label>
                  <select 
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg focus:border-[var(--accent)] outline-none"
                  >
                    <option value="7">7 Days (Emergency)</option>
                    <option value="14">14 Days (Intensive)</option>
                    <option value="30">30 Days (Standard)</option>
                    <option value="90">90 Days (Elite)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--accent)] uppercase tracking-widest mb-3">Intensity?</label>
                  <div className="flex gap-2">
                    {["Balanced", "High", "Insane"].map((level) => (
                      <button 
                        key={level}
                        onClick={() => setIntensity(level)}
                        className={`flex-1 py-4 rounded-xl border transition-all font-bold text-sm ${intensity === level ? "bg-[var(--accent)] border-[var(--accent)] text-black" : "bg-white/5 border-white/10 text-white/40"}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={generatePlan}
                disabled={!exam || loading}
                className="w-full py-6 rounded-3xl bg-white text-black font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
              >
                {loading ? "Strategizing..." : <>Generate Study Plan <Zap className="w-5 h-5 fill-black" /></>}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            <div className="p-8 md:p-12 rounded-[40px] border border-[var(--accent-glow)] bg-[var(--accent-bg)]/20">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                 <Target className="w-6 h-6 text-[var(--accent)]" /> {plan.title}
              </h2>
              <div className="space-y-6">
                {plan.phases.map((phase: any, i: number) => (
                  <div key={i} className="relative pl-8 border-l border-white/10">
                    <div className="absolute top-0 -left-[5px] w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                    <div className="mb-1 text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">{phase.duration}</div>
                    <h4 className="text-lg font-bold mb-1">{phase.name}</h4>
                    <p className="text-sm text-white/50">{phase.focus}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5 italic text-sm text-white/70">
                 "{plan.verdict}"
              </div>
            </div>

            <div className="p-10 rounded-[40px] bg-white text-black text-center">
              <h3 className="text-2xl font-black mb-4">WANT THE FULL DAILY SCHEDULE?</h3>
              <p className="text-black/60 mb-8 max-w-md mx-auto">
                Join 50,000+ students using The Professor to automate their academic success.
              </p>
              <Link href="/signup" className="inline-block px-12 py-5 rounded-3xl bg-black text-white font-black uppercase tracking-widest hover:scale-105 transition-all">
                Access Full Plan
              </Link>
            </div>
          </div>
        )}

        <section className="mt-24 pt-24 border-t border-white/5">
           <h2 className="text-2xl font-bold mb-12 text-center">Why use an AI Study Planner?</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                 <Calendar className="w-6 h-6 text-[var(--accent)] mb-4" />
                 <h4 className="font-bold mb-2">Automated Pacing</h4>
                 <p className="text-xs text-white/40">Never fall behind. The AI adjusts your schedule based on your actual progress.</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                 <Clock className="w-6 h-6 text-[var(--accent)] mb-4" />
                 <h4 className="font-bold mb-2">Focus Optimization</h4>
                 <p className="text-xs text-white/40">Spend time on what matters. We prioritize high-yield topics.</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                 <BookOpen className="w-6 h-6 text-[var(--accent)] mb-4" />
                 <h4 className="font-bold mb-2">Integrated Recall</h4>
                 <p className="text-xs text-white/40">Built-in review cycles based on the 'Professor Recall Loop'.</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
