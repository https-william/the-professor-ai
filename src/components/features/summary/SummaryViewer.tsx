"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Share2, 
  Download, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Lock,
  Settings,
  HelpCircle,
  Eye,
  EyeOff,
  BookOpen,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  Info,
  FileText,
  Sparkles
} from "lucide-react";

import Markdown from "@/components/ui/Markdown";

import { useToasts } from "@/components/ui/GlobalToasts";
import { cn } from "@/lib/utils";
import { exportToPDF } from "@/lib/pdf-bridge";
import { downloadSummaryOffline } from "@/lib/offline-download";
import { createClient } from "@/lib/supabase/client";

// Phase 0/1 Components & Hooks
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import ProgressNodeTrack from "@/components/ui/ProgressNodeTrack";
import OdometerCounter from "@/components/ui/OdometerCounter";
import AudioPlayer from "@/components/ui/AudioPlayer";
import ConfettiCelebration from "@/components/ui/ConfettiCelebration";
import KeyboardShortcutsModal from "@/components/ui/KeyboardShortcutsModal";
import DyslexiaToggle from "@/components/ui/DyslexiaToggle";
import CognitiveFatigueAlert from "@/components/ui/CognitiveFatigueAlert";
import XPToast from "@/components/ui/XPToast";
import FloatingChat from "@/components/ui/FloatingChat";

import FormulaCanvas from "./FormulaCanvas";
import GlossaryDrawer from "./GlossaryDrawer";
import HighlighterPen from "./HighlighterPen";
import WeaknessHeatmap from "./WeaknessHeatmap";

import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useStudySession } from "@/hooks/useStudySession";
import { useFeatureEvent } from "@/hooks/useFeatureEvent";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCognitiveFatigue } from "@/hooks/useCognitiveFatigue";
import { EVENT_TYPES, HighlightColor } from "@/lib/design-tokens";

interface SummaryViewerProps {
  data: string;
  title: string;
  generationId?: string | null;
}

// Sub-component: Spot Check
function SummaryCheckpoint({ block, onCorrect }: { block: any; onCorrect: () => void }) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isPassed, setIsPassed] = useState(false);

  const handleAnswer = (idx: number) => {
    if (isPassed || selectedIndices.includes(idx)) return;
    setSelectedIndices(prev => [...prev, idx]);
    if (idx === block.correctIndex) {
      setIsPassed(true);
      onCorrect();
    }
  };

  return (
    <GlassmorphicCard
      intensity="medium"
      radius="24px"
      className="mt-6 p-6 md:p-8 border border-white/5 shadow-2xl animate-in slide-in-from-bottom-4 duration-500"
    >
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle size={14} className="text-[var(--amber)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--amber)]/60">
          Professor's Spot Check
        </span>
      </div>
      <p className="text-base font-bold text-white mb-4 leading-relaxed">{block.question}</p>
      <div className="grid gap-3">
        {block.options.map((opt: string, i: number) => {
          const isSelected = selectedIndices.includes(i);
          const isCorrect = i === block.correctIndex;
          const showFeedback = isSelected || (isPassed && isCorrect);
          
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={isPassed || isSelected}
              className={cn(
                "w-full p-4 md:p-5 rounded-xl md:rounded-2xl text-left text-sm font-medium transition-all border flex items-center justify-between",
                showFeedback
                  ? isCorrect
                    ? "bg-[var(--emerald-dim)] border-[var(--emerald-border)] text-[var(--emerald-text)] font-bold shadow-[0_8px_32px_rgba(43,178,136,0.15)]"
                    : "bg-[var(--crimson-dim)] border-[var(--crimson-border)] text-[var(--crimson-text)]/80"
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white/70"
              )}
            >
              <span>{opt}</span>
              {showFeedback && isCorrect && <CheckCircle2 size={16} className="text-[var(--emerald)] shrink-0 ml-2" />}
              {showFeedback && !isCorrect && <span className="text-[var(--crimson)] font-black text-xs shrink-0 ml-2">✗</span>}
            </button>
          );
        })}
      </div>
      {selectedIndices.length > 0 && !isPassed && (
        <p className="mt-4 text-xs text-[var(--crimson)] italic animate-pulse">
          Ah, not quite! Try another option to find the key concept.
        </p>
      )}
    </GlassmorphicCard>
  );
}

// Convert knowledge checks to text representation for raw download/exports
export function convertKnowledgeChecksToMarkdown(text: string): string {
  if (!text) return "";
  let processed = text.replace(/([#*\s_]*)(Checking\s+Understanding|CHECKINGUNDERSTANDING|CheckingUnderstanding|checking\s+understanding)([#*\s_:]*)(\n|$)/gi, "\n");
  processed = processed.replace(/\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/g, (match, jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const question = parsed.question || "";
      const options = parsed.options || [];
      const correctIndex = parsed.correctIndex ?? 0;
      
      let markdown = `\n\n> 💡 **Professor's Spot Check**\n> \n> **Question:** ${question}\n> \n`;
      options.forEach((opt: string, idx: number) => {
        if (idx === correctIndex) {
          markdown += `> * **✓ ${opt} (Correct)**\n`;
        } else {
          markdown += `> * ${opt}\n`;
        }
      });
      markdown += `\n`;
      return markdown;
    } catch (e) {
      return "";
    }
  });
  return processed.replace(/\[KNOWLEDGE_CHECK\]/g, "");
}

// Apply Bionic Reading format
function applyBionicReading(text: string): string {
  if (!text) return "";
  return text.split(/\s+/).map(word => {
    if (word.startsWith("<") || word.includes("$") || word.includes("[") || word.includes("`") || word.includes("##") || word.includes("**")) {
      return word;
    }
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (cleanWord.length < 3) return word;
    const mid = Math.ceil(cleanWord.length / 2);
    const boldPart = word.substring(0, mid);
    const restPart = word.substring(mid);
    return `**${boldPart}**${restPart}`;
  }).join(" ");
}

export default function SummaryViewer({ data, title, generationId }: SummaryViewerProps) {
  const router = useRouter();
  const { addToast } = useToasts();
  const { preferences, updatePreference, updateMultiple } = useUserPreferences();
  const { trackEvent } = useFeatureEvent();
  const { minutesStudied, shouldBreak, dismissBreak, takeBreak } = useCognitiveFatigue();
  const { startSession, endSession } = useStudySession("summary", generationId || undefined);

  // Chapter state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [checkpointPassed, setCheckpointPassed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  // Custom interactive panel toggles
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Highlight states
  const [highlights, setHighlights] = useState<any[]>([]);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // Gamification & Animations
  const [xpGain, setXpGain] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [hasVotedFeedback, setHasVotedFeedback] = useState<'yes' | 'no' | null>(null);

  // Initialize and Track session
  useEffect(() => {
    document.body.style.overflow = "unset";
    document.documentElement.style.overflow = "unset";
    
    // Start study analytics tracking
    startSession();
    trackEvent(EVENT_TYPES.SUMMARY_STARTED, { packId: generationId || undefined });

    // Fetch user highlights for this pack/summary
    if (generationId && generationId !== "placeholder") {
      const loadHighlights = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("user_highlights")
            .select("*")
            .eq("user_id", user.id)
            .eq("pack_id", generationId);
          if (data) setHighlights(data);
        }
      };
      loadHighlights();

      // Load bookmark position
      const loadBookmark = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("user_bookmarks")
            .select("position_data")
            .eq("user_id", user.id)
            .eq("pack_id", generationId)
            .eq("surface", "summary")
            .maybeSingle();
          if (data?.position_data && typeof data.position_data === "object") {
            const savedIdx = (data.position_data as any).chapterIndex;
            if (typeof savedIdx === "number" && savedIdx >= 0) {
              setCurrentSlide(savedIdx);
            }
          }
        }
      };
      loadBookmark();
    }

    return () => {
      // End session, logs study time automatically
      endSession({ chapters_read: currentSlide + 1 });
    };
  }, [generationId]);

  // Split chapter content
  const processedChapters = useMemo(() => {
    if (!data) return [];
    
    const rawSections = data.split(/\n## /g);
    return rawSections.map((s, i) => {
      let sectionText = s;
      if (i > 0 && !s.startsWith("## ")) {
        sectionText = "## " + s;
      }
      
      let checkpoint = null;
      let text = sectionText;
      
      // Extract [KNOWLEDGE_CHECK]
      const match = sectionText.match(/\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/);
      if (match) {
        try {
          checkpoint = JSON.parse(match[1]);
          text = sectionText.replace(/\[KNOWLEDGE_CHECK\]\s*\{[\s\S]*?\}/, "").trim();
        } catch (e) {
          console.error("Failed to parse knowledge check JSON:", e);
        }
      }
      
      text = text.replace(/([#*\s_]*)(Checking\s+Understanding|CHECKINGUNDERSTANDING|CheckingUnderstanding|checking\s+understanding)([#*\s_:]*)(\n|$)/gi, "\n");
      
      let sectionTitle = "";
      let bodyText = text;
      
      const lines = text.split("\n");
      const firstLine = lines[0].trim();
      if (firstLine.startsWith("## ")) {
        sectionTitle = firstLine.replace("## ", "").trim();
        bodyText = lines.slice(1).join("\n").trim();
      } else if (firstLine.startsWith("# ")) {
        sectionTitle = firstLine.replace("# ", "").trim();
        bodyText = lines.slice(1).join("\n").trim();
      } else {
        sectionTitle = i === 0 ? title : `Chapter ${i + 1}`;
      }
      
      return { index: i, title: sectionTitle, text: bodyText, checkpoint };
    });
  }, [data, title]);

  const currentChapter = processedChapters[currentSlide];
  const isChapterLocked = !!currentChapter?.checkpoint && !checkpointPassed;

  // Apply DOM highlights recursively client-side
  useEffect(() => {
    const container = contentAreaRef.current;
    if (!container || !currentChapter) return;

    // Reset current highlight elements
    const existing = container.querySelectorAll(".professor-highlight");
    existing.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el);
      }
    });
    container.normalize();

    if (highlights.length === 0) return;

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || "";
        let matched = false;
        
        for (const hl of highlights) {
          const idx = text.toLowerCase().indexOf(hl.highlighted_text.toLowerCase());
          if (idx !== -1) {
            const matchText = text.substring(idx, idx + hl.highlighted_text.length);
            const span = document.createElement("span");
            span.className = `professor-highlight rounded px-1 transition-all ${
              hl.color === "amber" ? "bg-[var(--amber-dim)] border-b border-[var(--amber-border)] text-[var(--amber-text)]" :
              hl.color === "violet" ? "bg-[var(--violet-dim)] border-b border-[var(--violet-border)] text-[var(--violet-text)]" :
              hl.color === "emerald" ? "bg-[var(--emerald-dim)] border-b border-[var(--emerald-border)] text-[var(--emerald-text)]" :
              hl.color === "blue" ? "bg-[var(--blue-dim)] border-b border-[var(--blue-border)] text-[var(--blue-text)]" :
              "bg-[var(--crimson-dim)] border-b border-[var(--crimson-border)] text-[var(--crimson-text)]"
            }`;
            span.textContent = matchText;
            
            const before = document.createTextNode(text.substring(0, idx));
            const after = document.createTextNode(text.substring(idx + hl.highlighted_text.length));
            
            const parent = node.parentNode;
            if (parent) {
              parent.insertBefore(before, node);
              parent.insertBefore(span, node);
              parent.insertBefore(after, node);
              parent.removeChild(node);
            }
            matched = true;
            break;
          }
        }
        if (matched) {
          container.normalize();
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName !== "CODE" && el.tagName !== "PRE" && !el.classList.contains("katex")) {
          Array.from(node.childNodes).forEach(walk);
        }
      }
    };

    Array.from(container.childNodes).forEach(walk);
  }, [currentSlide, highlights, currentChapter]);

  // Persist Bookmark changes
  const saveBookmark = async (chapterIdx: number) => {
    if (!generationId || generationId === "placeholder") return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_bookmarks").upsert({
        user_id: user.id,
        pack_id: generationId,
        surface: "summary",
        position_data: { chapterIndex: chapterIdx },
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,pack_id,surface" });
    } catch (err) {
      console.warn("Failed to save bookmark:", err);
    }
  };

  // Keyboard shortcuts will be registered after handleFinish is defined to avoid Temporal Dead Zone errors

  const handleNextChapter = () => {
    if (isChapterLocked) {
      addToast("Solve the Spot Check to unlock the next chapter!", "error");
      return;
    }
    if (currentSlide < processedChapters.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      setCheckpointPassed(false);
      setHasVotedFeedback(null);
      saveBookmark(nextSlide);
      trackEvent(EVENT_TYPES.SUMMARY_CHAPTER_READ, { packId: generationId || undefined, metadata: { index: nextSlide } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const handlePrevChapter = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      setCheckpointPassed(false);
      setHasVotedFeedback(null);
      saveBookmark(prevSlide);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = () => {
    // Award completion XP
    setXpGain(100);
    trackEvent(EVENT_TYPES.SUMMARY_COMPLETED, { packId: generationId || undefined });
    
    setTimeout(() => {
      const isSprint = sessionStorage.getItem("isExamSprint") === "true";
      if (isSprint) {
        const sprintContent = sessionStorage.getItem("examSprintContent") || "";
        const params = JSON.parse(sessionStorage.getItem("generateParams") || "{}");
        sessionStorage.setItem("generateParams", JSON.stringify({
          ...params,
          content: sprintContent,
          type: "flashcards",
          count: 15,
          difficulty: "medium"
        }));
        router.push("/flashcards/generate");
        addToast("Summary complete. Starting Active Recall...", "success");
      } else {
        router.push("/library");
      }
    }, 1500);
  };

  const shortcutsConfig = useMemo(() => [
    { key: "ArrowRight", action: () => handleNextChapter(), description: "Next chapter" },
    { key: "ArrowLeft", action: () => handlePrevChapter(), description: "Previous chapter" },
    { key: "f", action: () => updatePreference("zen_focus_mode", !preferences?.zen_focus_mode), description: "Toggle Zen Focus mode" },
    { key: "g", action: () => setIsGlossaryOpen(prev => !prev), description: "Toggle Glossary drawer" },
    { key: "?", action: () => setShowShortcutsHelp(true), description: "Show keyboard shortcuts" }
  ], [preferences?.zen_focus_mode, currentSlide, isChapterLocked]);

  // Keyboard Shortcuts Registration
  useKeyboardShortcuts(shortcutsConfig);
  const createHighlight = async (text: string, color: HighlightColor) => {
    if (!generationId || generationId === "placeholder") return;
    
    // Add locally to state immediately
    const tempHighlight = { id: crypto.randomUUID(), highlighted_text: text, color };
    setHighlights(prev => [...prev, tempHighlight]);
    trackEvent(EVENT_TYPES.SUMMARY_HIGHLIGHT_CREATED, { packId: generationId, metadata: { color, textLength: text.length } });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("user_highlights").insert({
        user_id: user.id,
        pack_id: generationId,
        highlighted_text: text,
        color,
        surface: "summary",
      });
      addToast("Highlight saved to library!", "success");
    } catch (e) {
      console.warn("Failed to persist highlight:", e);
    }
  };

  // User Feedback collector
  const handleFeedback = async (vote: 'yes' | 'no') => {
    setHasVotedFeedback(vote);
    if (!generationId) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("user_feedback").insert({
        user_id: user.id,
        pack_id: generationId,
        surface: "summary",
        feedback_type: vote === 'yes' ? 'upvote' : 'downvote',
        content: `Chapter ${currentSlide + 1} feedback check.`,
      });
      addToast("Thanks for the feedback! The Professor is learning.", "success");
      trackEvent(EVENT_TYPES.FEEDBACK_SUBMITTED, { packId: generationId });
    } catch (e) {
      console.warn("Failed to save feedback:", e);
    }
  };

  // PDF Export
  const fullMarkdownContent = useMemo(() => {
    if (!data) return "";
    return convertKnowledgeChecksToMarkdown(data);
  }, [data]);

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    addToast("Preparing high-fidelity export...", "info");

    try {
      await exportToPDF("summary-export-container", {
        title: title,
        filename: `The_Professor_${title.replace(/\s+/g, '_')}`,
        author: "The Professor AI",
        markdownContent: fullMarkdownContent
      });
      addToast("PDF Export successful", "success");
      trackEvent(EVENT_TYPES.SUMMARY_EXPORTED, { packId: generationId || undefined, metadata: { format: "pdf" } });
    } catch (error) {
      addToast("Failed to generate PDF", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHTML = () => {
    addToast("Compiling offline HTML document...", "info");
    try {
      const container = document.querySelector("#summary-export-container .prose");
      const renderedHtml = container ? container.innerHTML : "";
      
      if (!renderedHtml) {
        addToast("Failed to compile content", "error");
        return;
      }

      downloadSummaryOffline(title, renderedHtml);
      addToast("HTML Download successful", "success");
      trackEvent(EVENT_TYPES.SUMMARY_EXPORTED, { packId: generationId || undefined, metadata: { format: "html" } });
    } catch (error) {
      addToast("Failed to compile HTML", "error");
    }
  };

  const handleCopyLink = () => {
    const url = generationId ? `${window.location.origin}/share?id=${generationId}` : window.location.href;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    addToast("Link copied to clipboard", "success");
  };

  const [isGeneratingPPTX, setIsGeneratingPPTX] = useState(false);

  const handleExportPPTX = async () => {
    if (isGeneratingPPTX) return;
    setIsGeneratingPPTX(true);
    addToast("Generating presentation deck...", "info");

    try {
      const response = await fetch("/api/generate-ppt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          summaryText: fullMarkdownContent,
          theme: "theme08"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate slide deck");
      }

      const result = await response.json();
      if (result.pptxUrl) {
        // Trigger download
        const link = document.createElement("a");
        link.href = result.pptxUrl;
        link.download = `${title.replace(/\\s+/g, "_")}_Presentation.pptx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addToast("PowerPoint deck generated successfully!", "success");
        trackEvent(EVENT_TYPES.SUMMARY_EXPORTED, { packId: generationId || undefined, metadata: { format: "pptx" } });
      } else {
        throw new Error("Export URL missing");
      }
    } catch (error) {
      console.error(error);
      addToast("Failed to generate PowerPoint presentation", "error");
    } finally {
      setIsGeneratingPPTX(false);
    }
  };

  if (processedChapters.length === 0 || !currentChapter) return null;



  // Process reading text format (Dyslexia and Bionic styles)
  const renderedChapterText = preferences?.bionic_reading 
    ? applyBionicReading(currentChapter.text) 
    : currentChapter.text;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--background)] text-[var(--foreground)] relative">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute w-[500px] h-[500px] rounded-full"
          style={{ top: "10%", left: "-10%", background: "radial-gradient(circle, rgba(229,169,60,0.05), transparent 60%)", filter: "blur(60px)" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full"
          style={{ bottom: "10%", right: "-10%", background: "radial-gradient(circle, rgba(150,115,245,0.05), transparent 60%)", filter: "blur(60px)" }} />
      </div>

      {/* Header Panel */}
      <header className="w-full border-b border-white/5 bg-zinc-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/library')} 
            className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--amber)] italic">
              Study Ingestion
            </span>
            <h1 className="text-xs font-bold text-white max-w-[200px] sm:max-w-[400px] truncate">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Settings Toggle */}
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-xl border transition-colors ${
              showConfig ? "bg-[var(--amber)]/10 border-[var(--amber)]/20 text-[var(--amber)]" : "bg-white/5 border-white/5 text-white/60 hover:text-white"
            }`}
            title="Aesthetics Settings"
          >
            <Settings size={16} />
          </button>

          {/* Glossary Panel Toggle */}
          <button 
            onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
            className={`p-2 rounded-xl border transition-colors ${
              isGlossaryOpen ? "bg-[var(--violet)]/10 border-[var(--violet)]/20 text-[var(--violet)]" : "bg-white/5 border-white/5 text-white/60 hover:text-white"
            }`}
            title="Toggle Metaphors"
          >
            <BookOpen size={16} />
          </button>

          {/* Zen mode shortcut button */}
          <button 
            onClick={() => updatePreference("zen_focus_mode", !preferences?.zen_focus_mode)}
            className={`p-2 rounded-xl border transition-colors ${
              preferences?.zen_focus_mode ? "bg-[var(--emerald)]/10 border-[var(--emerald)]/20 text-[var(--emerald)]" : "bg-white/5 border-white/5 text-white/60 hover:text-white"
            }`}
            title="Zen Focus Mode"
          >
            {preferences?.zen_focus_mode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </header>

      {/* Floating config panel overlay */}
      <AnimatePresence>
        {showConfig && (
          <>
            <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setShowConfig(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[68px] right-6 z-50 w-72"
            >
              <GlassmorphicCard intensity="heavy" radius="24px" className="p-4 border border-white/10 shadow-2xl flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--amber)]">
                  Aesthetics controls
                </span>
                
                {/* Dyslexia Toggle widget */}
                <DyslexiaToggle
                  fontSize={preferences?.font_size || 16}
                  lineHeight={preferences?.line_height || 1.6}
                  dyslexiaMode={preferences?.dyslexia_mode || false}
                  onFontSizeChange={(size) => updatePreference("font_size", size)}
                  onLineHeightChange={(height) => updatePreference("line_height", height)}
                  onDyslexiaModeChange={(enabled) => updatePreference("dyslexia_mode", enabled)}
                />

                {/* Bionic reading toggle */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs font-bold text-white/70">Bionic Reading</span>
                  <button
                    onClick={() => updatePreference("bionic_reading", !preferences?.bionic_reading)}
                    className={`w-10 h-6 rounded-full p-1 transition-all ${
                      preferences?.bionic_reading ? "bg-[var(--amber)]" : "bg-white/10"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-black transition-all ${
                      preferences?.bionic_reading ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </GlassmorphicCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Glossary Sidebar Panel */}
      <GlossaryDrawer 
        content={currentChapter.text}
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Horizontal Chapter Progress Node Track */}
      <div className="w-full max-w-3xl mx-auto px-6 pt-6 z-10">
        <ProgressNodeTrack
          total={processedChapters.length}
          current={currentSlide}
          completed={Array.from({ length: currentSlide }, (_, i) => i)}
          nodeSize={28}
          className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl"
          onNodeClick={(idx) => {
            if (idx <= currentSlide || !isChapterLocked) {
              setCurrentSlide(idx);
              setCheckpointPassed(false);
              saveBookmark(idx);
            } else {
              addToast("Complete the current Spot Check to proceed!", "error");
            }
          }}
        />
      </div>

      {/* Main Grid study area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-6 z-10 relative">
        
        {/* Left Column: Chapter content reader */}
        <div className={`flex-1 flex flex-col gap-6 ${preferences?.zen_focus_mode ? "w-full md:max-w-3xl mx-auto" : "md:w-3/5"}`}>
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/15 text-[10px] font-black uppercase tracking-widest">
              Chapter {currentSlide + 1} / {processedChapters.length}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight leading-tight text-white">
            {currentChapter.title}
          </h2>

          <div 
            ref={contentAreaRef}
            className={`scholar-card p-6 md:p-8 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl relative overflow-hidden transition-all duration-300`}
            style={{ 
              borderRadius: '28px',
              fontSize: `${preferences?.font_size || 16}px`,
              lineHeight: preferences?.line_height || 1.6,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
            
            {/* Highlighter pen trigger wrapper */}
            <HighlighterPen 
              containerRef={contentAreaRef}
              onHighlight={createHighlight}
            />

            <Markdown className="reveal-ceremony select-text">
              {renderedChapterText}
            </Markdown>
          </div>

          {/* Inline Spot check verification */}
          {currentChapter.checkpoint && !checkpointPassed && (
            <div className="mb-6">
              <SummaryCheckpoint 
                block={currentChapter.checkpoint} 
                onCorrect={() => {
                  setCheckpointPassed(true);
                  setXpGain(30); // Award intermediate XP
                  setShowConfetti(true);
                  addToast("Concept verified! +30 XP Gained.", "success");
                }} 
              />
            </div>
          )}

          {checkpointPassed && (
            <div className="mb-6 p-5 border border-[var(--emerald)]/20 bg-[var(--emerald)]/5 rounded-2xl flex flex-col items-center animate-in fade-in zoom-in duration-500">
               <CheckCircle2 size={32} className="mb-2 text-[var(--emerald)]" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--emerald)]">
                 Cognitive Alignment Secured
               </p>
            </div>
          )}

          {/* Chapter study feedback widget */}
          <GlassmorphicCard intensity="light" radius="16px" className="p-4 border border-white/5 flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Info size={11} /> Is this synthesis accurate?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleFeedback('yes')}
                disabled={hasVotedFeedback !== null}
                className={cn(
                  "p-2 rounded-xl border transition-all",
                  hasVotedFeedback === 'yes'
                    ? "bg-[var(--emerald)]/20 border-[var(--emerald)]/30 text-[var(--emerald)]"
                    : "bg-white/5 border-white/5 text-white/50 hover:text-white/80"
                )}
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => handleFeedback('no')}
                disabled={hasVotedFeedback !== null}
                className={cn(
                  "p-2 rounded-xl border transition-all",
                  hasVotedFeedback === 'no'
                    ? "bg-[var(--crimson)]/20 border-[var(--crimson)]/30 text-[var(--crimson)]"
                    : "bg-white/5 border-white/5 text-white/50 hover:text-white/80"
                )}
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          </GlassmorphicCard>

          {/* Bottom navigation slide row */}
          <div className="flex items-center justify-between mt-4 pb-12">
            <button 
              onClick={handlePrevChapter}
              className={cn(
                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all",
                currentSlide === 0 && "opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button 
              onClick={handleNextChapter}
              disabled={isChapterLocked}
              className={cn(
                "group flex items-center gap-3 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl",
                isChapterLocked 
                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed shadow-none" 
                  : currentSlide < processedChapters.length - 1
                  ? "bg-[var(--amber)] text-[var(--background)] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-[var(--emerald)] text-[var(--background)] hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <span>{isChapterLocked ? "Locked" : currentSlide < processedChapters.length - 1 ? "Proceed" : "Finish Summary"}</span>
              {isChapterLocked ? <Lock size={12} /> : currentSlide < processedChapters.length - 1 ? <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /> : <CheckCircle2 size={14} />}
            </button>
          </div>
        </div>

        {/* Right Column: Audio & Metaphors Sidebar (collapses in Zen mode) */}
        {!preferences?.zen_focus_mode && (
          <aside className="w-full md:w-2/5 flex flex-col gap-5 shrink-0 z-20">
            {/* Ambient Sound Machine & TTS */}
            <AudioPlayer 
              textToRead={currentChapter.text}
              title={currentChapter.title}
            />

            {/* LaTeX Formulas extractor */}
            <FormulaCanvas 
              content={currentChapter.text}
            />

            {/* Weakness heatmap tracker */}
            {generationId && (
              <WeaknessHeatmap 
                packId={generationId}
                chapters={processedChapters.map(ch => ({ title: ch.title, index: ch.index }))}
              />
            )}
          </aside>
        )}
      </main>

      {/* Floating Bottom Social share controls bar */}
      <div className="fixed bottom-6 left-6 z-[100] flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
        <button 
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--amber)] text-[var(--background)] font-bold text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
        >
          <Share2 size={13} />
          <span>{copySuccess ? "Copied!" : "Share Link"}</span>
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <div className="relative">
          <button 
            onClick={() => setShowDownloadMenu(prev => !prev)}
            disabled={isExporting}
            className="p-2.5 rounded-full hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center text-white/50 hover:text-white" 
            title="Download formats"
          >
            {isExporting ? (
              <Loader2 size={14} className="animate-spin text-[var(--amber)]" />
            ) : (
              <Download size={14} />
            )}
          </button>
          
          <AnimatePresence>
            {showDownloadMenu && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowDownloadMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-12 left-0 min-w-[150px] bg-zinc-950 border border-white/10 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-[110]"
                >
                  <button
                    onClick={async () => {
                      setShowDownloadMenu(false);
                      await handleExportPDF();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-[9px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                  >
                    <FileText size={11} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleExportHTML();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-[9px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                  >
                    <Download size={11} />
                    <span>Download HTML</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleExportPPTX();
                    }}
                    disabled={isGeneratingPPTX}
                    className="w-full px-3 py-2 rounded-lg text-left text-[9px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                  >
                    {isGeneratingPPTX ? (
                      <Loader2 size={11} className="animate-spin text-[var(--amber)]" />
                    ) : (
                      <Sparkles size={11} className="text-[var(--amber)]" />
                    )}
                    <span>Download PowerPoint</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Chat Strategy module */}
      <FloatingChat />

      {/* Cognitive break safeguards overlay */}
      {shouldBreak && (
        <CognitiveFatigueAlert 
          minutesStudied={minutesStudied}
          userName={preferences?.language === "en" ? "Scholar" : undefined}
          onDismiss={dismissBreak}
          onTakeBreak={takeBreak}
        />
      )}

      {/* Gamification overlay triggers */}
      {showConfetti && (
        <ConfettiCelebration 
          isActive={showConfetti}
          onComplete={() => setShowConfetti(false)}
        />
      )}

      {xpGain !== null && (
        <XPToast 
          xp={xpGain}
          label="Reading complete"
          onDismiss={() => setXpGain(null)}
        />
      )}

      {/* Shortcuts modal dialog */}
      <KeyboardShortcutsModal 
        shortcuts={shortcutsConfig}
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* Hidden layout elements for PDF engine export */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div id="summary-export-container" className="w-[800px] bg-[var(--background)] text-[var(--foreground)] p-16 font-sans">
          <style dangerouslySetInnerHTML={{ __html: `
            #summary-export-container table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 32px 0 !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              background: rgba(255, 255, 255, 0.01) !important;
              display: table !important;
            }
            #summary-export-container th {
              background-color: rgba(255, 255, 255, 0.05) !important;
              color: #E0E0E0 !important;
              font-weight: 800 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.1em !important;
              font-size: 11px !important;
              padding: 12px 18px !important;
              border-bottom: 2px solid rgba(255, 255, 255, 0.15) !important;
            }
            #summary-export-container td {
              padding: 12px 18px !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: rgba(224, 224, 224, 0.8) !important;
              font-size: 13px !important;
            }
          `}} />
          <div className="mb-12 pb-6 border-b border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--amber)] mb-3">Official Synthesis Report</p>
            <h1 className="text-4xl font-black tracking-tight leading-tight">{title}</h1>
          </div>
          <div className="prose prose-invert max-w-none">
            <Markdown>{fullMarkdownContent}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
