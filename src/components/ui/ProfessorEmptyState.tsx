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
    title: "Your Study Vault Awaits",
    description: "The dust settles on empty shelves. Time to fill them with knowledge.",
    accent: "#818CF8",
  },
  flashcards: {
    icon: "style",
    emoji: "🃏",
    title: "No Cards Yet",
    description: "Like a deck without any cards — useless! Generate your first flashcard set.",
    accent: "#F59E0B",
  },
  quizzes: {
    icon: "quiz",
    emoji: "🎯",
    title: "No Quizzes to Show",
    description: "Even the best athletes need training. Create your first quiz!",
    accent: "#10B981",
  },
  summaries: {
    icon: "summarize",
    emoji: "📝",
    title: "Summaries? None Here",
    description: "The great minds of history summarized their work. Create your first.",
    accent: "#6366F1",
  },
  search: {
    icon: "search_off",
    emoji: "🔍",
    title: "Nothing Found",
    description: "The archives have no record of this query. Try a different search.",
    accent: "#F59E0B",
  },
  roadmap: {
    icon: "map",
    emoji: "🗺️",
    title: "No Roadmap",
    description: "Every journey begins with a single step. Create your learning path.",
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
          href="/create"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 hover-scale-lg active:scale-[0.95]"
          style={{
            background: `linear-gradient(145deg, #F59E0B, #D4911A)`,
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 4px 16px rgba(245,158,11,0.4)",
            color: "#08080E",
          }}
        >
          <Plus size={18} strokeWidth={1.5} />
          Start Creating
        </Link>
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
          &ldquo;The only true wisdom is in knowing you know nothing.&rdquo; — Socrates
        </p>
      </div>
    </div>
  );
}
