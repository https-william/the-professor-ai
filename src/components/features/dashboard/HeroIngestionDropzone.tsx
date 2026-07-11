"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ClipboardPaste
} from "lucide-react";

interface HeroIngestionDropzoneProps {
  onFileSelect: (file: File) => void;
  onTextSubmit: (text: string, title?: string) => void;
  isProcessing?: boolean;
  processingText?: string;
}

const PARSING_TOKENS = [
  "INHALING DOCUMENT BYTESTREAM...",
  "EXTRACTING COGNITIVE SYNTAX TREES...",
  "ISOLATING HIGH-YIELD CONCEPTS...",
  "MAP-REDUCING MULTI-PARAGRAPH ENTITIES...",
  "CALIBRATING ACTIVE RECALL PROMPTS...",
  "DECONSTRUCTING INTELLECTUAL BLINDSPOTS...",
  "COMPUTING SYLLABUS ROADMAP MILESTONES...",
  "PACKAGING INTERACTIVE STUDY LAB..."
];

function AnimatedParsingTrack() {
  const [tokenIdx, setTokenIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTokenIdx(prev => (prev + 1) % PARSING_TOKENS.length);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto mt-6 p-4.5 rounded-2xl dark:bg-zinc-950/90 bg-[var(--background-secondary)] border border-[var(--border)] font-mono text-[10px] dark:text-emerald-400 text-emerald-700 text-left space-y-1.5 shadow-inner h-24 overflow-hidden relative">
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t dark:from-zinc-950 from-[var(--background-secondary)] to-transparent pointer-events-none" />
      <div className="animate-pulse flex items-center gap-1.5 text-[9px] font-black dark:text-emerald-500 text-emerald-600 uppercase tracking-widest mb-1 pb-1 border-b border-[var(--border)]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        <span>Parsing Live Stream</span>
      </div>
      {PARSING_TOKENS.slice(Math.max(0, tokenIdx - 2), tokenIdx + 1).map((tok, idx) => {
        const isCurrent = idx === Math.min(tokenIdx, 2);
        return (
          <div key={idx} className={`transition-all duration-200 ${isCurrent ? "opacity-100 font-bold translate-x-1" : "opacity-35"}`}>
            &gt; {tok}
          </div>
        );
      })}
    </div>
  );
}

export function HeroIngestionDropzone({
  onFileSelect,
  onTextSubmit,
  isProcessing = false,
  processingText = "Getting your study notes ready..."
}: HeroIngestionDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"drop" | "paste">("drop");
  const [pastedText, setPastedText] = useState("");
  const [notebookTitle, setNotebookTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || isProcessing) return;
    onTextSubmit(pastedText, notebookTitle.trim() || undefined);
  };

  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--border-2)] rounded-[2rem] overflow-hidden shadow-xs relative">
      {/* Header Pill Selection */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--blue)] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
            Ingestion Hub
          </span>
        </div>

        <div className="flex p-0.5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setMode("drop")}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 ${
              mode === "drop"
                ? "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] shadow-xs"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Upload size={12} />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 ${
              mode === "paste"
                ? "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] shadow-xs"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <ClipboardPaste size={12} />
            <span>Paste Notes</span>
          </button>
        </div>
      </div>

      {/* Dropzone Canvas or Paste Form */}
      <div className="relative z-10 p-6 sm:p-10">
        {isProcessing ? (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[var(--blue)]/10 border border-[var(--blue)]/30 flex items-center justify-center animate-bounce">
                <Sparkles size={28} className="text-[var(--blue)] animate-spin-slow" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--emerald)] flex items-center justify-center text-white border-2 border-[var(--background)] shadow-md">
                <CheckCircle2 size={12} />
              </div>
            </div>
            <h3 className="text-lg font-black text-[var(--foreground)] mb-1">
              {processingText}
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] max-w-sm font-semibold">
              Preparing your deconstructed study workspace...
            </p>
            
            {/* Live Parsing Token Stream */}
            <AnimatedParsingTrack />
          </div>
        ) : mode === "drop" ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer group/drop relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
              isDragging
                ? "border-[var(--blue)] bg-[var(--blue)]/10 scale-[0.99]"
                : "border-[var(--border-2)] hover:border-[var(--blue)]/50 bg-[var(--background)]/30 hover:bg-[var(--surface)]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-[var(--background)] border border-[var(--border)] shadow-sm flex items-center justify-center mb-4 group-hover/drop:scale-110 group-hover/drop:border-[var(--blue)]/40 transition-transform">
              <Upload size={24} className="text-[var(--blue)]" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-[var(--foreground)] mb-1">
              Drop your lecture PDF, Syllabus, or Notes here
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] mb-6 max-w-md font-semibold">
              Supports <span className="text-[var(--foreground)] font-mono">PDF, DOCX, TXT, MD</span> up to 25MB. OCR enabled.
            </p>

            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all">
              <span>Browse Files</span>
              <ArrowRight size={14} />
            </span>
          </div>
        ) : (
          <form onSubmit={handlePasteSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1.5">
                Notebook Title (Optional)
              </label>
              <input
                type="text"
                value={notebookTitle}
                onChange={(e) => setNotebookTitle(e.target.value)}
                placeholder="e.g. BIO 201: Cellular Respiration Week 4"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--blue)] text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1.5">
                Raw Lecture Notes or Transcript
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={6}
                placeholder="Paste your raw lecture transcript, textbook excerpt, or bullet points here..."
                className="w-full p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--blue)] text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none transition-all resize-y"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[var(--foreground-muted)] font-mono">
                {pastedText.length.toLocaleString()} characters
              </span>
              <button
                type="submit"
                disabled={!pastedText.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--blue)] text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(74,124,245,0.35)] hover:bg-[var(--blue-light)] disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all"
              >
                <Sparkles size={14} />
                <span>Create Study Pack</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default HeroIngestionDropzone;
