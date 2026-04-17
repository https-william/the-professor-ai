"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Layers, 
  FileText, 
  Route, 
  GraduationCap, 
  HelpCircle, 
  Lightbulb, 
  CheckCircle,
  ShieldCheck
} from "lucide-react";

/* ═══════════════════════════════════════════════
   DEMO DATA — zero-token, pre-determined content
   ═══════════════════════════════════════════════ */
const CHAT_DEMO = [
  { role: "user" as const, text: "Explain Quantum Entanglement like I'm 5." },
  {
    role: "professor" as const,
    text: "Imagine two magic dice. No matter how far apart they are — even across the galaxy — if you roll a 6 on one, the other **instantly** shows a 6 too. They're spooky soulmates, linked by rules that even Einstein called \"spooky action at a distance.\" The universe just... knows.",
  },
];

const FLASHCARD_DEMO = {
  front: "What is the Heisenberg Uncertainty Principle?",
  back: "You cannot simultaneously know the exact position AND momentum of a particle. The more precisely one is measured, the less precisely the other can be known. Δx · Δp ≥ ℏ/2",
  topic: "Quantum Mechanics",
};

const SUMMARY_DEMO = {
  title: "Mitochondrial Function in Eukaryotic Cells",
  sections: [
    { label: "Key Concept", text: "Mitochondria generate ATP through oxidative phosphorylation via the electron transport chain.", color: "#6366F1" },
    { label: "Supporting Detail", text: "The inner membrane's cristae increase surface area for ATP synthase complexes.", color: "#818CF8" },
    { label: "Clinical Link", text: "Mitochondrial dysfunction is implicated in Parkinson's, Alzheimer's, and metabolic syndromes.", color: "#F59E0B" },
    { label: "Common Mistake", text: "Students confuse the matrix (site of Krebs cycle) with the intermembrane space (proton gradient).", color: "#EF4444" },
  ],
};

const ROADMAP_DEMO = {
  title: "Machine Learning Foundations",
  phases: [
    { 
      phase: "I: Theoretical Core", 
      detail: "Statistical learning theory & gradient descent mechanics.",
      milestone: "Calculus Verification",
      duration: "Week 1-2"
    },
    { 
      phase: "II: Supervised Mastery", 
      detail: "Implementation of SVMs, Random Forests, and loss optimization.",
      milestone: "Predictive Model Build",
      duration: "Week 3-5"
    },
    { 
      phase: "III: Neural Architectures", 
      detail: "Backpropagation deep-dive and Convolutional layers.",
      milestone: "Neural Net Deployment",
      duration: "Week 6-8"
    },
  ]
};

/* ═══════════════════════════════════════════════
   TABS CONFIG
   ═══════════════════════════════════════════════ */
const TABS = [
  { id: "chat", label: "Professor Chat", icon: MessageSquare, color: "#34D399" },
  { id: "flashcards", label: "Flashcards", icon: Layers, color: "#F59E0B" },
  { id: "summary", label: "Smart Summary", icon: FileText, color: "#6366F1" },
  { id: "roadmap", label: "Architect", icon: Route, color: "#C084FC" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ═══════════════════════════════════════════════
   CHAT DEMO PANEL
   ═══════════════════════════════════════════════ */
function ChatDemo() {
  const [visibleChars, setVisibleChars] = useState(0);
  const [showUser, setShowUser] = useState(false);
  const [showProf, setShowProf] = useState(false);
  const fullText = CHAT_DEMO[1].text;

  useEffect(() => {
    // Step 1: Show user message after brief delay
    const t1 = setTimeout(() => setShowUser(true), 400);
    // Step 2: Start typing professor response
    const t2 = setTimeout(() => setShowProf(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (!showProf) return;
    if (visibleChars >= fullText.length) return;
    const speed = fullText[visibleChars] === " " ? 15 : 25;
    const timer = setTimeout(() => setVisibleChars((c) => c + 1), speed);
    return () => clearTimeout(timer);
  }, [showProf, visibleChars, fullText]);

  const renderedText = fullText.slice(0, visibleChars).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

  return (
    <div className="flex flex-col gap-4 p-5 md:p-6 h-full">
      {/* User message */}
      <div
        className={`flex justify-end transition-all duration-500 ${showUser ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="px-5 py-3 rounded-2xl rounded-br-md bg-white/[0.06] border border-white/[0.08] max-w-[80%]">
          <p className="text-[13px] md:text-sm text-white/70">{CHAT_DEMO[0].text}</p>
        </div>
      </div>

      {/* Professor response */}
      <div
        className={`flex gap-3 transition-all duration-500 ${showProf ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/25 flex items-center justify-center shrink-0 mt-0.5">
          <GraduationCap size={16} strokeWidth={1.5} className="text-[#F59E0B]" />
        </div>
        <div className="flex-1">
          <p
            className="text-[13px] md:text-sm text-white/60 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderedText }}
          />
          {visibleChars < fullText.length && (
            <span className="inline-block w-1.5 h-4 bg-[#F59E0B]/60 rounded-[1px] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FLASHCARD DEMO PANEL
   ═══════════════════════════════════════════════ */
function FlashcardDemo() {
  const [flipped, setFlipped] = useState(false);
  const [autoFlipDone, setAutoFlipDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setFlipped(true);
      setAutoFlipDone(true);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-5 md:p-6 gap-4">
      {/* Topic pill */}
      <span className="px-3 py-1 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-bold uppercase tracking-widest border border-[#F59E0B]/20">
        {FLASHCARD_DEMO.topic}
      </span>

      {/* Card with flip */}
      <div
        className="relative w-full max-w-sm cursor-pointer group"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="w-full rounded-2xl p-6 md:p-8 text-center border border-[#F59E0B]/20"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.06), 0 8px 30px rgba(0,0,0,0.3)",
            }}
          >
            <HelpCircle size={24} strokeWidth={1.5} className="text-[#F59E0B]/40 mb-3 block mx-auto" />
            <p className="text-sm md:text-base text-white/80 font-medium leading-relaxed">{FLASHCARD_DEMO.front}</p>
            <p className="text-[10px] text-white/20 mt-4 uppercase tracking-widest font-bold">
              {autoFlipDone ? "Click to flip" : "Flipping..."}
            </p>
          </div>

          {/* Back */}
          <div
            className="w-full rounded-2xl p-6 md:p-8 text-center border border-emerald-500/20 absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.02))",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.06), 0 8px 30px rgba(0,0,0,0.3)",
            }}
          >
            <Lightbulb size={24} strokeWidth={1.5} className="text-emerald-400/40 mb-3 block mx-auto" />
            <p className="text-sm md:text-base text-white/80 leading-relaxed">{FLASHCARD_DEMO.back}</p>
            <p className="text-[10px] text-white/20 mt-4 uppercase tracking-widest font-bold">Click to flip</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUMMARY DEMO PANEL
   ═══════════════════════════════════════════════ */
function SummaryDemo() {
  const [visibleSections, setVisibleSections] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    SUMMARY_DEMO.sections.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleSections(i + 1), 600 + i * 500));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="p-5 md:p-6 h-full flex flex-col">
      {/* Title */}
      <div className="mb-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#6366F1]/60 mb-1.5 block">Auto-Generated Summary</span>
        <h4 className="text-sm md:text-base font-bold text-white/80">{SUMMARY_DEMO.title}</h4>
      </div>

      {/* Progressive sections */}
      <div className="space-y-3 flex-1">
        {SUMMARY_DEMO.sections.map((section, i) => (
          <div
            key={i}
            className={`flex gap-3 items-start transition-all duration-500 ${
              i < visibleSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="w-1 h-full min-h-[40px] rounded-full shrink-0" style={{ background: section.color + "40" }} />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: section.color + "90" }}>
                {section.label}
              </span>
              <p className="text-[12px] md:text-[13px] text-white/50 leading-relaxed">{section.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROADMAP DEMO PANEL
   ═══════════════════════════════════════════════ */
function RoadmapDemo() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timers = ROADMAP_DEMO.phases.map((_, i) => 
      setTimeout(() => setVisible(i + 1), 600 + i * 700)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC] animate-pulse" />
        <h4 className="text-[13px] md:text-sm font-black text-white/90 uppercase tracking-widest">{ROADMAP_DEMO.title}</h4>
      </div>

      <div className="relative pl-6 space-y-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-white/5" />
        {ROADMAP_DEMO.phases.map((phase, i) => (
          <div 
            key={i} 
            className={`relative transition-all duration-700 ${i < visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-x-3"}`}
          >
            <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[#0C0C16] border border-white/20 flex items-center justify-center ${i < visible ? "border-[#C084FC]" : ""}`}>
               <div className={`w-1 h-1 rounded-full ${i < visible ? "bg-[#C084FC]" : "bg-white/10"}`} />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">{phase.phase}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.03] text-white/20 font-bold border border-white/5">{phase.duration}</span>
            </div>
            <p className="text-[12px] md:text-[13px] text-white/70 font-medium leading-relaxed mb-2">{phase.detail}</p>
            <div className="flex items-center gap-1.5 opacity-40">
              <CheckCircle size={14} strokeWidth={1.5} className="text-[#C084FC]" />
              <span className="text-[10px] font-black uppercase tracking-tight text-[#C084FC]">{phase.milestone}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN SHOWCASE COMPONENT
   ═══════════════════════════════════════════════ */
export default function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [resetKey, setResetKey] = useState(0);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setResetKey((k) => k + 1); // force re-mount to replay animations
  };

  const activeConfig = TABS.find((t) => t.id === activeTab)!;

  return (
    <section className="relative w-full py-20 md:py-28 px-5 md:px-6 z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--foreground-muted)] mb-4">
            Try it yourself
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">
            See it in action
          </h2>
        </div>

        {/* Showcase Container */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "rgba(12,12,22,0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: `0 25px 80px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4), 0 0 60px ${activeConfig.color}08`,
            transition: "box-shadow 0.5s ease",
          }}
        >
          {/* Tab Bar — macOS style */}
          <div className="flex items-center gap-0 border-b border-white/[0.05] bg-white/[0.02]">
            {/* Traffic lights */}
            <div className="flex items-center gap-2 px-4 py-3.5 border-r border-white/[0.04]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 flex-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-4 md:px-5 py-3.5 text-[12px] md:text-[13px] font-medium transition-all duration-300 border-r border-white/[0.04] whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-white/90 bg-white/[0.04]"
                      : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
                  }`}
                >
                  <tab.icon 
                    size={16} 
                    strokeWidth={1.5} 
                    className="transition-colors"
                    style={{ color: activeTab === tab.id ? tab.color : undefined }}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>

                  {/* Active indicator */}
                  {activeTab === tab.id && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                      style={{ background: tab.color }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-4 text-[10px] font-bold text-white/15 uppercase tracking-widest">
              <ShieldCheck size={14} strokeWidth={1.5} className="text-emerald-400/40" />
              Zero tokens
            </div>
          </div>

          {/* Content Panel */}
          <div className="min-h-[300px] md:min-h-[360px]" key={resetKey}>
            {activeTab === "chat" && <ChatDemo />}
            {activeTab === "flashcards" && <FlashcardDemo />}
            {activeTab === "summary" && <SummaryDemo />}
            {activeTab === "roadmap" && <RoadmapDemo />}
          </div>
        </div>
      </div>
    </section>
  );
}
