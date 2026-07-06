"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ClipboardPaste,
  BookOpen
} from "lucide-react";

interface HeroIngestionDropzoneProps {
  onFileSelect: (file: File) => void;
  onTextSubmit: (text: string, title?: string) => void;
  isProcessing?: boolean;
  processingText?: string;
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
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() || isProcessing) return;
    onTextSubmit(pastedText.trim(), notebookTitle.trim() || "Pasted Lecture Notes");
  };

  return (
    <div className="w-full relative rounded-3xl bg-[var(--surface)] border border-[var(--border-2)] shadow-xl overflow-hidden transition-all duration-300 group">
      {/* Background Ambient Glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--blue)]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[var(--blue)]/15 transition-all duration-700" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[var(--violet)]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[var(--violet)]/15 transition-all duration-700" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:px-8 border-b border-[var(--border)] bg-[var(--background)]/40 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-[var(--emerald)] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--emerald)]">
              Instant Study Prep
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight font-heading">
            Create Study Pack
          </h2>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--background)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setMode("drop")}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "drop"
                ? "bg-[var(--blue)] text-white shadow-md"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Upload size={13} />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "paste"
                ? "bg-[var(--blue)] text-white shadow-md"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <ClipboardPaste size={13} />
            <span>Paste Text</span>
          </button>
        </div>
      </div>

      {/* Dropzone Canvas or Paste Form */}
      <div className="relative z-10 p-6 sm:p-10">
        {isProcessing ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[var(--blue)]/10 border border-[var(--blue)]/30 flex items-center justify-center">
                <Sparkles size={28} className="text-[var(--blue)] animate-spin-slow" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--emerald)] flex items-center justify-center text-white border-2 border-[var(--background)] animate-bounce">
                <CheckCircle2 size={12} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              {processingText}
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] max-w-sm">
              We're reading through your notes, setting up flashcards, and building a quick quiz for you...
            </p>
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

            <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-1">
              Drop your lecture PDF, Syllabus, or Notes here
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] mb-6 max-w-md">
              Supports <span className="text-[var(--foreground)] font-mono">PDF, DOCX, TXT, MD</span> up to 25MB. OCR enabled for scanned documents.
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
