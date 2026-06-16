"use client";

import React, { useState } from "react";
import { 
  ArrowRight, 
  FileText, 
  LayoutDashboard, 
  Brain, 
  Layers, 
  FileQuestion, 
  Gamepad2, 
  Flame, 
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  const [activeMockTab, setActiveMockTab] = useState<string>("Study Lab");

  return (
    <section className="relative w-full min-h-[95dvh] flex flex-col items-center justify-start pt-32 pb-16 px-4 md:px-8 lg:px-12 overflow-hidden bg-transparent z-10">

      {/* Hero Content Container */}
      <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center z-10">
        
        {/* Hero Text & CTA Block */}
        <div className="flex flex-col items-center text-center max-w-4xl relative">
          {/* Main Headline */}
          <h1 
            style={{ fontFamily: "var(--font-outfit)" }}
            className="text-[44px] leading-[1.05] sm:text-6xl md:text-7xl lg:text-[80px] font-black text-[var(--foreground)] tracking-tight mb-6 uppercase text-3d"
          >
            Your notes. <br />
            Just the <span className="bg-gradient-to-r from-white via-blue-100 to-[#4A7CF5] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(74,124,245,0.25)]">good parts.</span>
          </h1>

          {/* Subheading */}
          <p className="font-sans text-sm sm:text-base md:text-lg font-medium text-[var(--foreground-secondary)] opacity-85 max-w-2xl leading-relaxed mb-8">
            Uni is a lot, we get it. Drop your notes here and we'll turn them into simple, structured study guides so you can actually enjoy your day. Get your time back.
          </p>

          {/* CTA Button Group */}
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in [--animation-delay:200ms] mb-16">
            <Link
              href="/signup"
              className="px-10 py-4.5 rounded-2xl flex items-center gap-2 bg-[#4A7CF5] text-white font-sans font-black text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(74,124,245,0.3),inset_0_2px_0_0_rgba(255,255,255,0.2)] hover:bg-[#3b6ee0] hover:shadow-[0_4px_25px_rgba(74,124,245,0.5)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Flat 2.0 Product Mockup Workspace Preview (Aesthetic Centerpiece) */}
        <div className="relative w-full max-w-5xl animate-fade-in [--animation-delay:350ms]">
          {/* Ambient Glow Halo behind Mockup */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-amber-500/10 rounded-[32px] filter blur-[80px] opacity-80 pointer-events-none -z-10" />
          <div className="w-full rounded-[32px] border border-[var(--border)] bg-[var(--card)] shadow-[0_30px_70px_rgba(0,0,0,0.4)] overflow-hidden">
          
          {/* Simulated Browser Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-2)]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
              <span className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
            </div>
            <div className="hidden md:flex items-center justify-center px-4 py-1.5 rounded-lg bg-[var(--bg-3)] border border-[var(--border)] text-[11px] font-mono text-[var(--foreground-muted)] w-96 select-none">
              theprofessor.xyz/workspace/biology-101
            </div>
            <div className="w-12 h-2" />
          </div>

          {/* Workspace Shell Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[480px]">
            
            {/* Sidebar Left Component */}
            <div className="hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--bg-2)] p-4 justify-between">
              <div className="flex flex-col gap-1">
                <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-[var(--foreground-muted)] uppercase">
                  Workspace
                </div>
                {[
                  { label: "Dashboard", icon: <LayoutDashboard size={16} /> },
                  { label: "Library", icon: <FileText size={16} />, badge: "4" },
                  { label: "Study Lab", icon: <Brain size={16} /> },
                  { label: "Flashcards", icon: <Layers size={16} /> },
                  { label: "Quiz Room", icon: <FileQuestion size={16} /> },
                  { label: "Match Arena", icon: <Gamepad2 size={16} /> },
                ].map((item) => {
                  const isActive = activeMockTab === item.label;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setActiveMockTab(item.label)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                        isActive
                          ? "bg-zinc-900/80 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                          : "text-[var(--foreground-secondary)] hover:bg-[var(--border)]/30 hover:text-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        {item.icon}
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-3 rounded-r-md bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                        )}
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Streak Metric in Sidebar */}
              <div className="p-3 rounded-2xl bg-orange-500/5 border border-orange-500/15 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <Flame size={18} className="fill-orange-400/20" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-[var(--foreground)]">Streak Active!</div>
                  <div className="text-[10px] text-[var(--foreground-secondary)]">12 days study streak</div>
                </div>
              </div>
            </div>

            {/* Workspace Main Workspace Panel */}
            <div className="p-6 md:p-8 flex flex-col gap-6 bg-[var(--card)]">
              
              {/* Top Row: Workspace Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">Biology 101: Lecture 3 Synthesis</h3>
                  <p className="text-xs text-[var(--foreground-muted)] font-medium">Uploaded 2 mins ago · 4 learning modules active</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                    <CheckCircle2 size={12} />
                    Synthesized
                  </span>
                </div>
              </div>

              {/* Grid: Parser Animation Demo + Summary Pack Mock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Visual AI Document Parser Card */}
                <div className="p-5 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-[var(--foreground-muted)] uppercase">AI Extractor Engine</span>
                    <span className="text-xs text-blue-400 font-mono font-bold">scanning...</span>
                  </div>

                  {/* Mock Uploaded File details */}
                  <div className="p-4 rounded-xl bg-[var(--bg-3)] border border-[var(--border)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[var(--foreground)] truncate">Cellular_Mitosis_V2.pdf</div>
                      <div className="text-[10px] text-[var(--foreground-secondary)]">14.8 MB · 32 PDF Slides</div>
                    </div>
                  </div>

                  {/* Realtime Extraction Progress Bar */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-[var(--foreground-muted)]">
                      <span>Concept Indexing</span>
                      <span>85% complete</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-3)] overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[85%] animate-pulse" />
                    </div>
                  </div>

                  {/* Parsed Findings preview */}
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">Identified key modules:</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-3)] border border-[var(--border)] text-[10px] font-bold text-[var(--foreground-secondary)] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        14 Definitions
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-3)] border border-[var(--border)] text-[10px] font-bold text-[var(--foreground-secondary)] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        4 Core Milestones
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-3)] border border-[var(--border)] text-[10px] font-bold text-[var(--foreground-secondary)] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        10 Active Recall Cards
                      </span>
                    </div>
                  </div>
                </div>

                {/* Generated Learning Deck Cards (Flat 2.0 tactile grid) */}
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold tracking-wider text-[var(--foreground-muted)] uppercase">Generated Modules</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Module 1: Study Guide */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] hover:border-blue-500/20 hover:bg-[var(--bg-3)] transition-all cursor-pointer flex flex-col gap-3 group">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                        <Brain size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-[var(--foreground)]">Study Guide</div>
                        <div className="text-[10px] text-[var(--foreground-muted)]">Concept outline & deep-dives</div>
                      </div>
                    </div>

                    {/* Module 2: Flashcards */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] hover:border-purple-500/20 hover:bg-[var(--bg-3)] transition-all cursor-pointer flex flex-col gap-3 group">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <Layers size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-[var(--foreground)]">Flashcards</div>
                        <div className="text-[10px] text-[var(--foreground-muted)]">Active recall & definitions</div>
                      </div>
                    </div>

                    {/* Module 3: Quiz Room */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] hover:border-emerald-500/20 hover:bg-[var(--bg-3)] transition-all cursor-pointer flex flex-col gap-3 group">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <FileQuestion size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-[var(--foreground)]">Quiz Room</div>
                        <div className="text-[10px] text-[var(--foreground-muted)]">Simulate exam situations</div>
                      </div>
                    </div>

                    {/* Module 4: Match Game */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] hover:border-violet-500/20 hover:bg-[var(--bg-3)] transition-all cursor-pointer flex flex-col gap-3 group">
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                        <Gamepad2 size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-[var(--foreground)]">Match Arena</div>
                        <div className="text-[10px] text-[var(--foreground-muted)]">Fast interactive matching</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
        </div>

        {/* Social Proof Ticker */}
        <div className="w-full overflow-hidden relative py-6 mask-image-horizontal animate-fade-in [--animation-delay:500ms]">
          <div className="flex gap-8 whitespace-nowrap animate-ticker">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-8 items-center">
                {[
                  { name: "Tunde", action: "aced his mid-terms" },
                  { name: "Amaka", action: "saved 4 hours today" },
                  { name: "Ifeanyi", action: "turned 50 slides into 5 pages" },
                  { name: "Bolu", action: "is finally sleeping 8 hours" },
                  { name: "Chinelo", action: "passed her nursing exam" },
                  { name: "Femi", action: "aced his SAT prep" },
                  { name: "Zainab", action: "summarized 30 lectures" },
                  { name: "Emeka", action: "is ready for his finals" },
                  { name: "Adaeze", action: "made a law guide in seconds" },
                  { name: "Chidi", action: "finished his JAMB revision" },
                  { name: "Bolaji", action: "understands his math now" },
                  { name: "Funke", action: "saved her whole weekend" }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--bg-2)] hover:bg-[var(--border)] transition-colors select-none"
                  >
                    <span className="font-sans text-xs font-bold text-[var(--foreground)]">
                      {item.name}
                    </span>
                    <span className="font-sans text-xs font-medium text-[var(--foreground-muted)]">
                      {item.action}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Scroll Indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 z-10 pointer-events-none opacity-50">
        <div className="w-[1px] h-9 bg-gradient-to-b from-[var(--foreground)] to-transparent animate-pulse opacity-60" />
        <span className="font-sans text-[8px] font-bold tracking-[0.25em] uppercase text-[var(--foreground-muted)]">
          scroll
        </span>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          width: fit-content;
          animation: ticker 45s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
        .mask-image-horizontal {
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          animation-delay: var(--animation-delay, 0ms);
          opacity: 0;
          transform: translateY(12px);
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
