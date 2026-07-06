"use client";

import Link from "next/link";
import { 
    Library, 
    Layers, 
    HelpCircle, 
    FileText, 
    Search, 
    Map as MapIcon, 
    Plus 
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  library_books: Library,
  style: Layers,
  quiz: HelpCircle,
  summarize: FileText,
  search_off: Search,
  map: MapIcon,
  add: Plus
};

type EmptyType = "library" | "flashcards" | "quizzes" | "summaries" | "search" | "roadmap";

interface ProfessorEmptyStateProps {
  type: EmptyType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryAction?: { label: string; href: string };
}

const themes: Record<EmptyType, { icon: string; emoji: string; title: string; description: string; accent: string }> = {
  library: {
    icon: "library_books",
    emoji: "📚",
    title: "Your Study Lounge Awaits",
    description: "Your desk is ready! Drop a syllabus or lecture note to start your mastery journey.",
    accent: "#818CF8",
  },
  flashcards: {
    icon: "style",
    emoji: "🃏",
    title: "No Flashcards Yet",
    description: "Ready for quick recall? We can generate 15 rapid-fire cards from your notes in seconds.",
    accent: "#F59E0B",
  },
  quizzes: {
    icon: "quiz",
    emoji: "🎯",
    title: "No Quizzes Yet",
    description: "Let's test your memory! Build a custom 5-question practice quiz from your notes.",
    accent: "#10B981",
  },
  summaries: {
    icon: "summarize",
    emoji: "📝",
    title: "No Summaries Yet",
    description: "Long textbook chapter? Let us distill it down to a 3-minute executive breakdown.",
    accent: "#6366F1",
  },
  search: {
    icon: "search_off",
    emoji: "🔍",
    title: "No Matches Found",
    description: "We couldn't find that exact phrase in your library. Try searching for a broader concept or topic tag.",
    accent: "#F59E0B",
  },
  roadmap: {
    icon: "map",
    emoji: "🗺️",
    title: "No Topic Roadmap Yet",
    description: "Let's map out this subject step-by-step so you never feel lost.",
    accent: "#3B82F6",
  },
};

export default function ProfessorEmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryAction,
}: ProfessorEmptyStateProps) {
  const theme = themes[type];
  const accent = theme.accent;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Animated Icon Container */}
      <div className="relative mb-8 group">
        {/* Pulsing glow */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse"
          style={{ background: accent }}
        />
        
        {/* Main icon */}
        <div 
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover-scale-md"
          style={{
            background: `linear-gradient(145deg, ${accent}15, ${accent}05)`,
            border: `1px solid ${accent}20`,
            boxShadow: `inset 0 2px 4px ${accent}10, 0 8px 32px ${accent}20`,
          }}
        >
          {(() => {
              const IconComp = ICON_MAP[theme.icon] || HelpCircle;
              return <IconComp size={48} strokeWidth={1.5} style={{ color: `${accent}80` }} />;
          })()}
          
          {/* Floating emoji */}
          <span className="absolute -top-2 -right-2 text-3xl animate-bounce">
            {theme.emoji}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 
        className="text-xl font-bold mb-3 tracking-tight"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {title || theme.title}
      </h3>

      {/* Description */}
      <p 
        className="text-sm leading-relaxed mb-8 max-w-sm"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {description || theme.description}
      </p>

      {/* Primary Action */}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 hover-scale-lg active:scale-[0.95]"
          style={{
            background: `linear-gradient(145deg, ${accent}, ${accent}CC)`,
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2), 0 4px 16px ${accent}40`,
            color: "#08080E",
          }}
        >
          <Plus size={18} strokeWidth={1.5} />
          {actionLabel}
        </Link>
      ) : (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 hover-scale-lg active:scale-[0.95]"
          style={{
            background: `linear-gradient(145deg, #F59E0B, #D4911A)`,
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 4px 16px rgba(245,158,11,0.4)",
            color: "#08080E",
          }}
        >
          <Plus size={18} strokeWidth={1.5} />
          Drop Notes in Lounge
        </Link>
      )}

      {/* Day 1 Starter Kits for Library Empty State */}
      {type === "library" && (
        <div className="mt-8 mb-4 w-full max-w-xl text-left">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--amber)] mb-3 flex items-center gap-2">
            <span>⚡ Day 1 Starter Kits: Instant Study Vaults</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/dashboard?starter=bio"
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--amber)]/40 hover:bg-white/10 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[var(--emerald)]/15 text-[var(--emerald)] border border-[var(--emerald)]/30">
                    Biology
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">12 Cards</span>
                </div>
                <h5 className="text-xs font-bold text-white group-hover:text-[var(--amber)] transition-colors">
                  Cellular Respiration 101
                </h5>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                  Glycolysis, Krebs Cycle, and Electron Transport Chain mastery.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-[var(--amber)]">
                <span>Launch Starter Vault</span>
                <span>→</span>
              </div>
            </Link>
            <Link
              href="/dashboard?starter=contract"
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--violet)]/40 hover:bg-white/10 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[var(--violet)]/15 text-[var(--violet)] border border-[var(--violet)]/30">
                    Law
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">15 Cards</span>
                </div>
                <h5 className="text-xs font-bold text-white group-hover:text-[var(--violet)] transition-colors">
                  Contract Law 101
                </h5>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                  Essential elements: Offer, Acceptance, Consideration, and Legal Capacity.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-[var(--violet)]">
                <span>Launch Starter Vault</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Secondary Action */}
      {secondaryAction && (
        <Link
          href={secondaryAction.href}
          className="mt-4 text-sm font-medium transition-colors hover:underline"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {secondaryAction.label}
        </Link>
      )}

      {/* Academic Quote Footer */}
      <div className="mt-10 pt-6 border-t border-white/5">
        <p 
          className="text-xs italic"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          &ldquo;The only true wisdom is in knowing you know nothing.&rdquo; - Socrates
        </p>
      </div>
    </div>
  );
}
