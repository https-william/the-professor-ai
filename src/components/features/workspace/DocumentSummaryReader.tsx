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

function bionicTransform(text: string): React.ReactNode[] {
  // Simple tokenization that bolds first half of each word
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
    // Replace [1], [Source: X], [Ref: Y] with clickable markdown links if they aren't already links
    return summaryText.replace(/(?<!\[)\[((?:Source|Ref|Page|Doc)[\s\w:\-]+|\d+)\](?!\()/gi, '[$1](#cite-$1)');
  }, [summaryText]);

  const handleTTS = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = activeView === "summary" ? summaryText : rawText || summaryText;
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

  const displayText = activeView === "summary" ? processedSummaryText : (rawText || "No raw text available.");

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
            <ReactMarkdown
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
              {processedSummaryText}
            </ReactMarkdown>
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
