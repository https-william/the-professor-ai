"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Brain, 
  Gamepad2, 
  Trophy, 
  ArrowRight, 
  Lock,
  Sparkles,
  Zap,
  Target
} from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import StandardContainer from "@/components/ui/StandardContainer";
import { cn } from "@/lib/utils";

export default function PreviewPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("summary");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFileName(localStorage.getItem("pending_upload_name") || "Course Materials");
    }
  }, []);

  const TABS = [
    { id: "summary", label: "Study Summary", icon: FileText },
    { id: "flashcards", label: "Flashcards", icon: Zap, locked: true },
    { id: "exam", label: "Mock Exam", icon: Target, locked: true },
    { id: "match", label: "Match Game", icon: Gamepad2, locked: true },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-6 relative">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-[100px] pointer-events-none" />
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full mix-blend-screen opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--blue-dim) 0%, var(--blue-glow) 50%, transparent 70%)", filter: "blur(100px)", top: "10%", right: "10%" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <StandardContainer>
        <div className="max-w-5xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-black tracking-[0.25em] uppercase text-emerald-400 mb-3 flex items-center gap-2"
              >
                <Sparkles size={12} />
                <span>Analysis Complete</span>
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-4 uppercase italic"
              >
                Your Smart Plan is Ready.
              </motion.h1>
              <p className="text-white/60 font-medium text-lg">
                The Professor has extracted <span className="text-amber-500 font-bold">42 concepts</span> and <span className="text-violet-400 font-bold">12 potential exam questions</span> from <span className="italic text-white">"{fileName}"</span>.
              </p>
            </div>

            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push("/signup")}
              className="px-8 py-4 flex items-center gap-3 group whitespace-nowrap font-black uppercase tracking-[0.15em] rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-900 shadow-[0_4px_20px_rgba(229,169,60,0.2)] border border-amber-500/20 duration-300"
            >
              <span className="text-sm font-black">Save my study pack</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {/* Interactive Preview Area */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            
            {/* Sidebar Tabs */}
            <div className="flex flex-col gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.locked && setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left group",
                    activeTab === tab.id 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                      : "bg-white/[0.02] text-white/50 border-white/5 hover:border-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
                    <span className="font-bold text-sm">{tab.label}</span>
                  </div>
                  {tab.locked && <Lock size={14} className="opacity-40" />}
                </button>
              ))}

              <div className="mt-8 p-6 rounded-[2rem] bg-amber-500/[0.03] border border-amber-500/10 hidden lg:block">
                <Trophy className="text-amber-500 mb-4" size={24} />
                <h4 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-2">Professor's Tip</h4>
                <p className="text-xs text-amber-500/80 font-medium leading-relaxed">
                  "Starting with the Summary builds intuition. The Mock Exam ensures you never panic in the hall."
                </p>
              </div>
            </div>

            {/* Main Content Preview */}
            <GlassmorphicCard 
              intensity="heavy" 
              radius="2.5rem" 
              className="relative min-h-[600px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]"
            >
              
              <AnimatePresence mode="wait">
                {activeTab === "summary" ? (
                  <motion.div 
                    key="summary-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 md:p-12 h-full flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight italic">Study Summary</h2>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Read time: 6m</span>
                    </div>

                    <div className="space-y-6 flex-1">
                      <div className="space-y-2">
                        <h3 className="text-lg font-black text-white">1. Executive Overview</h3>
                        <p className="text-white/60 leading-relaxed font-medium">
                          This material covers the foundational principles of <span className="text-amber-400 font-bold">Advanced Financial Management</span>. The Professor has identified three recurring themes that examiners love to focus on...
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-black text-white">2. Key Concepts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            "Net Present Value (NPV) Analysis",
                            "Capital Asset Pricing Model",
                            "Portfolio Optimization Strategy",
                            "Market Efficiency Hypothesis"
                          ].map(concept => (
                            <div key={concept} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                              <span className="text-sm font-bold text-white/80">{concept}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Blocker Overlay for Bottom half */}
                      <div className="relative mt-8 pt-8">
                        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent z-10" />
                        <div className="blur-[8px] opacity-40 select-none pointer-events-none space-y-6">
                           <h3 className="text-lg font-black text-white">3. Exam Shortcuts</h3>
                           <p className="text-white/60 leading-relaxed">
                             When calculating the WACC, students often forget to adjust for tax implications. The shortcut is to always verify the marginal tax rate...
                           </p>
                           <p className="text-white/60 leading-relaxed">
                             In the previous semester exams, 60% of the marks came from the case study on Corporate Restructuring. Focus on the debt-to-equity ratios...
                           </p>
                        </div>
                        
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-16 h-16 rounded-full bg-amber-500 text-neutral-900 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/20">
                             <Lock size={32} />
                          </div>
                          <h3 className="text-2xl font-black text-white mb-3">Unlock the full material</h3>
                          <p className="text-white/50 max-w-sm mb-8 font-medium">
                            The Professor has generated 12 more pages of summaries, flashcards, and a full mock exam based on your notes.
                          </p>
                          <button 
                            onClick={() => router.push("/signup")}
                            className="px-10 py-4 font-black uppercase tracking-[0.15em] rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-900 shadow-[0_4px_20px_rgba(229,169,60,0.2)] border border-amber-500/20 duration-300"
                          >
                            Save for free
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

            </GlassmorphicCard>
          </div>

          {/* Viral Social Proof */}
          <div className="mt-16 flex flex-col items-center">
             <div className="flex -space-x-3 mb-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-[var(--background)] bg-[var(--foreground)]/5 flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${i * 40}, 50%, 20%)` }}>
                    {String.fromCharCode(64 + i)}{String.fromCharCode(90 - i)}
                  </div>
                ))}
             </div>
             <p className="text-white/40 font-medium text-sm">
                Join <span className="text-white font-black">hundreds of students</span> already acing their courses this semester.
             </p>
          </div>

        </div>
      </StandardContainer>
    </main>
  );
}
