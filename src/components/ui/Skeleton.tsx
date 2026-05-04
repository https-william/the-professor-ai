"use client";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-zinc-800/30 animate-shimmer-sweep", className)}
      {...props}
    />
  );
}

// Card Skeleton - For flashcards, quiz cards
export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-start gap-4">
        {/* Icon placeholder */}
        <Skeleton className="w-10 h-10 rounded-xl" />
        
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          {lines > 2 && <Skeleton className="h-4 w-1/2" />}
        </div>
      </div>
    </div>
  );
}

// List Skeleton - For library items
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Flashcard Skeleton - Matches flashcard shape
export function FlashcardSkeleton() {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5" />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>
        
        {/* Front content */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2" />
        
        {/* Divider */}
        <div className="my-4 h-px bg-white/5" />
        
        {/* Back content (answer) */}
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// Quiz Question Skeleton - Matches quiz question shape
export function QuizQuestionSkeleton({ options = 4 }: { options?: number }) {
  return (
    <div className="rounded-[2rem] p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Question number */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-3 w-20" />
      </div>
      
      {/* Question text */}
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-4/5 mb-6" />
      
      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: options }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <Skeleton className="w-6 h-6 rounded-md" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Summary Skeleton - Matches summary section shape
export function SummarySkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="rounded-[2rem] p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Section heading */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-1 h-8 rounded-full" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          
          {/* Content lines */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Roadmap Skeleton - Matches roadmap phase shape
export function RoadmapSkeleton({ phases = 4 }: { phases?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: phases }).map((_, i) => (
        <div key={i} className="relative pl-8">
          {/* Timeline dot */}
          <div className="absolute left-0 top-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            {i < phases - 1 && <Skeleton className="w-0.5 h-24 ml-1.5" />}
          </div>
          
          {/* Phase content */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Skeleton className="h-5 w-1/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Grid Skeleton - For bento layouts
export function GridSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-3xl p-6 aspect-[4/3]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex flex-col h-full justify-between">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HERO MNEMONIC LOADING SKELETON
// Shows the animated ABC → XYZ strike during app loads
// ═══════════════════════════════════════════════════

export function HeroLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-10 rounded-3xl min-w-[280px]"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Animated ABC strike */}
      <div className="relative">
        <span className="font-galaxie text-3xl font-bold text-[var(--foreground-muted)] opacity-30 tracking-tight">ABC</span>
        <svg className="absolute inset-[-15%] w-[130%] h-[130%] overflow-visible pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
          <line 
            x1="0" y1="20" x2="100" y2="20" 
            stroke="var(--foreground-muted)" 
            strokeWidth="4" 
            strokeLinecap="round"
            className="animate-strike-draw"
            style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
          />
        </svg>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
        <span className="text-xs text-[var(--foreground-muted)] tracking-wide">Preparing your session...</span>
      </div>
    </div>
  );
}

export { Skeleton };
