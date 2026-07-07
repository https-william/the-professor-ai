"use client";

import React, { useState, useRef, useMemo } from "react";
import { 
  Type, 
  Eye, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  BookOpen, 
  FileText,
  AlignLeft,
  Check
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocumentSummaryReaderProps {
  title: string;
  summaryText: string;
  rawText?: string;
  onCitationClick?: (citation: string) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

interface KnowledgeCheckProps {
  data: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

function KnowledgeCheck({ data }: KnowledgeCheckProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isPassed, setIsPassed] = useState(false);

  const handleSelect = (idx: number) => {
    if (isPassed || selectedIndices.includes(idx)) return;
    setSelectedIndices(prev => [...prev, idx]);
    if (idx === data.correctIndex) {
      setIsPassed(true);
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] my-6 flex flex-col w-full shadow-inner relative overflow-hidden group/check">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--blue)]">Professor&apos;s Spot Check</span>
      </div>
      
      {/* Question - Increased font size for readability */}
      <h4 className="text-sm sm:text-base font-black text-[var(--foreground)] mb-5 leading-snug tracking-tight">
        {data.question}
      </h4>

      {/* Options - Increased font size and panel size */}
      <div className="grid grid-cols-1 gap-3">
        {data.options.map((opt: string, i: number) => {
          const isSelected = selectedIndices.includes(i);
          const isCorrect = i === data.correctIndex;
          const showFeedback = isSelected || (isPassed && isCorrect);

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isPassed || isSelected}
              className={`w-full p-4.5 md:p-5 text-left text-xs sm:text-sm font-bold rounded-xl md:rounded-2xl transition-all border flex items-center gap-4 relative overflow-hidden ${
                showFeedback 
                  ? isCorrect 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.1)]" 
                    : "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.1)]"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--background)] hover:border-[var(--blue)]/40 hover:text-[var(--foreground)] hover:shadow-md shadow-sm"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border text-xs shrink-0 font-black transition-all ${
                showFeedback && isCorrect ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                isSelected && !isCorrect ? "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]" :
                "bg-[var(--background)] border-[var(--border)]"
              }`}>
                {String.fromCharCode(65 + i)}
              </div>
              <span className="relative z-10 leading-snug">{opt}</span>
            </button>
          );
        })}
      </div>
      
      {selectedIndices.length > 0 && !isPassed && (
        <p className="mt-4 text-xs text-red-400 font-bold italic animate-pulse">
          Ah, not quite! Pick another option to sync your understanding.
        </p>
      )}
    </div>
  );
}

function bionicTransform(text: string): React.ReactNode[] {
  return text.split(/(\s+)/).map((segment, index) => {
    if (/\s+/.test(segment)) return segment;
    if (segment.length <= 1) return <b key={index}>{segment}</b>;
    const splitIndex = Math.ceil(segment.length / 2);
    const boldPart = segment.slice(0, splitIndex);
    const normalPart = segment.slice(splitIndex);
    return (
      <span key={index}>
        <b className="font-extrabold text-[var(--foreground)]">{boldPart}</b>
        <span className="opacity-80">{normalPart}</span>
      </span>
    );
  });
}

export function DocumentSummaryReader({
  title,
  summaryText,
  rawText,
  onCitationClick,
  containerRef: externalRef
}: DocumentSummaryReaderProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const contentRef = externalRef || internalRef;

  const [activeView, setActiveView] = useState<"summary" | "raw">("summary");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono" | "dyslexic">("sans");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [isBionic, setIsBionic] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const processedSummaryText = useMemo(() => {
    if (!summaryText) return "";
    return summaryText.replace(/(?<!\[)\[((?:Source|Ref|Page|Doc)[\s\w:\-]+|\d+)\](?!\()/gi, '[$1](#cite-$1)');
  }, [summaryText]);

  const handleTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = activeView === "summary" 
      ? summaryText.replace(/\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/g, "") 
      : rawText || summaryText;
    
    const cleanText = textToRead
      .replace(/#+\s*/g, "")
      .replace(/[*_`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 0.95;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const fontClass = fontFamily === "serif" 
    ? "font-serif tracking-normal" 
    : fontFamily === "mono" 
    ? "font-mono tracking-tight" 
    : fontFamily === "dyslexic"
    ? "dyslexic-mode font-sans tracking-wide leading-loose"
    : "font-sans tracking-normal";

  const sizeClass = fontSize === "sm"
    ? "text-xs leading-relaxed"
    : fontSize === "lg"
    ? "text-base sm:text-lg leading-loose"
    : "text-sm sm:text-base leading-relaxed";

  const displayText = activeView === "summary" 
    ? processedSummaryText.replace(/\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/g, "") 
    : (rawText || "No raw text available.");

  // Segment summary text into markdown and knowledge check blocks
  const blocks = useMemo(() => {
    if (!processedSummaryText) return [];
    const checkRegex = /\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/g;
    const result: { type: "markdown" | "checkpoint"; content: string; checkpointData?: any; id: string }[] = [];
    let lastIndex = 0;
    let match;
    let idx = 0;
    
    while ((match = checkRegex.exec(processedSummaryText)) !== null) {
      const markdownBefore = processedSummaryText.slice(lastIndex, match.index);
      if (markdownBefore.trim()) {
        result.push({ type: "markdown", content: markdownBefore, id: `md-${idx++}` });
      }
      try {
        const checkpointData = JSON.parse(match[1]);
        result.push({ type: "checkpoint", content: match[0], checkpointData, id: `check-${idx++}` });
      } catch (e) {
        console.error("Failed to parse knowledge check in DocumentSummaryReader:", e);
      }
      lastIndex = checkRegex.lastIndex;
    }
    
    const remainingMarkdown = processedSummaryText.slice(lastIndex);
    if (remainingMarkdown.trim()) {
      result.push({ type: "markdown", content: remainingMarkdown, id: `md-${idx++}` });
    }
    return result;
  }, [processedSummaryText]);

  return (
    <div className="w-full flex flex-col h-full bg-[var(--surface)] border border-[var(--border-2)] rounded-3xl overflow-hidden shadow-md">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <button
              onClick={() => setActiveView("summary")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === "summary"
                  ? "bg-[var(--blue)] text-white shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Sparkles size={13} />
              <span>AI Summary</span>
            </button>
            <button
              onClick={() => setActiveView("raw")}
              disabled={!rawText}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === "raw"
                  ? "bg-[var(--blue)] text-white shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-40"
              }`}
            >
              <FileText size={13} />
              <span>Source Notes</span>
            </button>
          </div>

          <h3 className="hidden sm:block text-xs font-bold text-[var(--foreground)] truncate max-w-xs">
            {title}
          </h3>
        </div>

        {/* Reader Ergonomic Controls */}
        <div className="flex items-center gap-2">
          {/* Font Picker */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] font-medium">
            <button
              onClick={() => setFontFamily("sans")}
              className={`px-2 py-1 rounded ${fontFamily === "sans" ? "bg-[var(--background)] text-[var(--foreground)] font-bold shadow-xs" : "text-[var(--foreground-muted)]"}`}
              title="Sans-serif font"
            >
              Sans
            </button>
            <button
              onClick={() => setFontFamily("serif")}
              className={`px-2 py-1 rounded font-serif ${fontFamily === "serif" ? "bg-[var(--background)] text-[var(--foreground)] font-bold shadow-xs" : "text-[var(--foreground-muted)]"}`}
              title="Serif font"
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily("mono")}
              className={`px-2 py-1 rounded font-mono ${fontFamily === "mono" ? "bg-[var(--background)] text-[var(--foreground)] font-bold shadow-xs" : "text-[var(--foreground-muted)]"}`}
              title="Mono font"
            >
              Mono
            </button>
            <button
              onClick={() => setFontFamily("dyslexic")}
              className={`px-2 py-1 rounded ${fontFamily === "dyslexic" ? "bg-[var(--background)] text-[var(--blue)] font-bold shadow-xs" : "text-[var(--foreground-muted)]"}`}
              title="OpenDyslexic / Ergonomic Dyslexic Mode"
            >
              Dyslexic
            </button>
          </div>

          {/* Size Picker */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] font-medium">
            <button
              onClick={() => setFontSize("sm")}
              className={`px-2 py-1 rounded ${fontSize === "sm" ? "bg-[var(--background)] text-[var(--foreground)] font-bold shadow-xs" : "text-[var(--foreground-muted)]"}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize("md")}
              className={`px-2 py-1 rounded ${fontSize === "md" ? "bg-[var(--background)] text-[var(--foreground)] font-bold shadow-xs" : "text-[var(--foreground-muted)]"}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize("lg")}
              className={`px-2 py-1 rounded ${fontSize === "lg" ? "bg-[var(--background)] text-[var(--foreground)] font-bold shadow-xs" : "text-[var(--foreground-muted)]"}`}
            >
              A+
            </button>
          </div>

          {/* Bionic Reading Toggle */}
          <button
            onClick={() => setIsBionic(!isBionic)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
              isBionic
                ? "bg-[var(--amber)]/15 border-[var(--amber)]/40 text-[var(--amber)]"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
            title="Speed Reading (Bionic Fixation)"
          >
            <Eye size={13} />
            <span className="hidden md:inline">Bionic</span>
          </button>

          {/* TTS Read Aloud */}
          <button
            onClick={handleTTS}
            className={`p-2 rounded-lg border transition-all ${
              isSpeaking
                ? "bg-[var(--amber)]/15 border-[var(--amber)]/40 text-[var(--amber)] animate-pulse"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
            title={isSpeaking ? "Stop Reading" : "Read Aloud"}
          >
            {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Reader Body */}
      <div 
        ref={contentRef}
        className={`flex-1 overflow-y-auto p-6 sm:p-10 ${fontClass} ${sizeClass} text-[var(--foreground-secondary)]`}
      >
        {isBionic ? (
          <div className="space-y-4 whitespace-pre-wrap">
            {displayText.split("\n\n").map((para, idx) => (
              <p key={idx} className="mb-4">
                {bionicTransform(para)}
              </p>
            ))}
          </div>
        ) : activeView === "summary" ? (
          <div className="prose prose-invert max-w-none space-y-4">
            {blocks.map((block) => {
              if (block.type === "markdown") {
                return (
                  <ReactMarkdown
                    key={block.id}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-black text-[var(--foreground)] mb-3 pb-2 border-b border-[var(--border)]">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold text-[var(--foreground)] mt-6 mb-2 flex items-center gap-2"><span className="w-1.5 h-4 bg-[var(--blue)] rounded-full shrink-0" />{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-bold text-[var(--foreground)] mt-4 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-[var(--blue)] pl-4 py-1 my-3 bg-[var(--background)]/50 rounded-r-xl italic text-[var(--foreground-muted)]">{children}</blockquote>,
                      code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-xs font-mono text-[var(--amber)]">{children}</code>,
                      a: ({ href, children, ...props }) => {
                        if (href && href.startsWith('#cite-')) {
                          const citeTarget = href.replace('#cite-', '');
                          return (
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                onCitationClick?.(citeTarget);
                              }}
                              title={`Click to view source in raw notes: ${citeTarget}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-[var(--amber)]/15 border border-[var(--amber)]/30 text-[var(--amber)] text-[10px] font-mono font-bold hover:bg-[var(--amber)] hover:text-[var(--background)] hover:shadow-[0_0_12px_rgba(229,169,60,0.6)] transition-all cursor-pointer select-none"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse" />
                              <span>[{children}]</span>
                            </span>
                          );
                        }
                        return <a href={href} {...props} target="_blank" rel="noopener noreferrer" className="text-[var(--blue)] underline hover:text-[var(--blue-light)]">{children}</a>;
                      }
                    }}
                  >
                    {block.content}
                  </ReactMarkdown>
                );
              } else {
                return (
                  <KnowledgeCheck
                    key={block.id}
                    data={block.checkpointData}
                  />
                );
              }
            })}
          </div>
        ) : (
          <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-[var(--foreground-secondary)] bg-[var(--background)]/60 p-6 rounded-2xl border border-[var(--border)]">
            {rawText}
          </pre>
        )}
      </div>
    </div>
  );
}
