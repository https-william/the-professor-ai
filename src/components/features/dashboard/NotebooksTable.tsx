"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Trash2, 
  Share2, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export interface StudyNotebookSummary {
  id: string;
  title: string;
  summaryPreview?: string;
  cardCount?: number;
  quizScore?: number;
  updatedAt: string;
  tags?: string[];
}

interface NotebooksTableProps {
  notebooks: StudyNotebookSummary[];
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  isLoading?: boolean;
  onLoadDemo?: (type: 'mitosis' | 'contract') => void;
  onFileSelect?: (file: File) => void;
}

export function NotebooksTable({
  notebooks,
  onDelete,
  onShare,
  isLoading = false,
  onLoadDemo,
  onFileSelect
}: NotebooksTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "mastered" | "needs_review">("all");

  const filteredNotebooks = notebooks.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (n.summaryPreview && n.summaryPreview.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeTab === "mastered") return (n.quizScore ?? 0) >= 80;
    if (activeTab === "needs_review") return (n.quizScore ?? 0) < 80;
    return true;
  });

  return (
    <div className="w-full rounded-3xl bg-[var(--surface)] border border-[var(--border-2)] shadow-lg overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-6 sm:px-8 border-b border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
            Study Notebooks ({notebooks.length})
          </h3>
          <p className="text-xs text-[var(--foreground-muted)]">
            Your synthesized AI vaults and active retention decks
          </p>
        </div>

        {/* Search and Tabs */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notebooks..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--blue)] text-xs font-medium text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] shrink-0">
            {[
              { id: "all", label: "All" },
              { id: "needs_review", label: "Review Required" },
              { id: "mastered", label: "Mastered" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Body */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-[var(--foreground-muted)]">
          Loading your study notebooks...
        </div>
      ) : filteredNotebooks.length === 0 ? (
        searchQuery ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center mb-3">
              <Search size={20} className="text-[var(--foreground-muted)]" />
            </div>
            <p className="text-sm font-bold text-[var(--foreground)] mb-1">
              No results found
            </p>
            <p className="text-xs text-[var(--foreground-muted)] max-w-xs">
              No notebooks matched &ldquo;{searchQuery}&rdquo;. Try checking your spelling or clearing the search filter.
            </p>
          </div>
        ) : (
          <div className="py-10 px-6 flex flex-col items-center justify-center bg-gradient-to-b from-[var(--surface)] to-[var(--background)]/30 rounded-3xl">
            {/* High-visibility drop zone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onFileSelect) {
                  onFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = ".pdf,.docx,.txt,.md";
                fileInput.onchange = (e: any) => {
                  if (e.target?.files && e.target.files.length > 0 && onFileSelect) {
                    onFileSelect(e.target.files[0]);
                  }
                };
                fileInput.click();
              }}
              className="w-full max-w-2xl py-12 px-6 rounded-2xl border-2 border-dashed border-[var(--border-2)] hover:border-[var(--blue)]/50 bg-[var(--background)]/30 hover:bg-[var(--surface)] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group mb-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--blue)]/10 border border-[var(--blue)]/30 flex items-center justify-center mb-4 shadow-inner group-hover:scale-105 transition-transform">
                <Sparkles size={24} className="text-[var(--blue)] animate-pulse" />
              </div>
              <h4 className="text-base sm:text-lg font-black text-[var(--foreground)] mb-1.5 font-heading">
                Got an upcoming test?
              </h4>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] max-w-md mb-6 font-semibold leading-relaxed">
                Drop your lecture slides or notes here to build your first Exam Sprint pack instantly.
              </p>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-wider shadow-md hover:opacity-90 active:scale-95 transition-all">
                Select File
              </span>
            </div>

            <div className="w-full border-t border-[var(--border)] pt-8">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] block mb-4 text-left pl-1">
                Or jump start with a demo pack
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
              <div 
                onClick={() => onLoadDemo?.('mitosis')}
                className="group p-5 rounded-2xl bg-[var(--background)] border border-[var(--border-2)] hover:border-[var(--blue)] text-left cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/20">
                      Biology Starter
                    </span>
                    <span className="text-[11px] font-mono text-[var(--foreground-muted)]">15 Cards</span>
                  </div>
                  <h5 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--blue)] transition-colors mb-1">
                    Mitosis &amp; Cell Division
                  </h5>
                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">
                    Comprehensive breakdown of Prophase, Metaphase, Anaphase, Telophase, and Cytokinesis.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--blue)]">
                  <span>Load Starter Kit</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => onLoadDemo?.('contract')}
                className="group p-5 rounded-2xl bg-[var(--background)] border border-[var(--border-2)] hover:border-[var(--blue)] text-left cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--violet)]/10 text-[var(--violet)] border border-[var(--violet)]/20">
                      Law Starter
                    </span>
                    <span className="text-[11px] font-mono text-[var(--foreground-muted)]">15 Cards</span>
                  </div>
                  <h5 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--blue)] transition-colors mb-1">
                    Contract Law 101
                  </h5>
                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">
                    Essential elements: Offer, Acceptance, Consideration, Intention to create legal relations, and Capacity.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--blue)]">
                  <span>Load Starter Kit</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      ) : (
        <div className="divide-y divide-[var(--border)]/60">
          {filteredNotebooks.map((nb) => {
            const score = nb.quizScore ?? 0;
            return (
              <div
                key={nb.id}
                onClick={() => router.push(`/library/pack/${nb.id}`)}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:px-8 hover:bg-[var(--background)]/60 cursor-pointer transition-all"
              >
                {/* Left Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="p-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] group-hover:border-[var(--blue)]/40 transition-colors shrink-0 mt-0.5">
                    <BookOpen size={18} className="text-[var(--blue)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--blue)] transition-colors truncate">
                        {nb.title}
                      </h4>
                      {nb.tags && nb.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {nb.summaryPreview && (
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-1">
                        {nb.summaryPreview}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {nb.updatedAt}
                      </span>
                      <span>•</span>
                      <span>{nb.cardCount ?? 15} Cards</span>
                    </div>
                  </div>
                </div>

                {/* Right Status & Actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--border)]/50">
                  {/* Mastery Badge */}
                  {/* Gestalt Progress Ring */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                        {/* Track */}
                        <circle 
                          cx="16" 
                          cy="16" 
                          r="12" 
                          fill="transparent" 
                          stroke="var(--border)" 
                          strokeWidth="3" 
                          className="opacity-20 dark:opacity-30" 
                        />
                        {/* Progress path */}
                        <circle 
                          cx="16" 
                          cy="16" 
                          r="12" 
                          fill="transparent" 
                          stroke={score >= 80 ? "var(--emerald)" : score > 0 ? "var(--amber)" : "var(--blue)"} 
                          strokeWidth="3.2" 
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 12}
                          strokeDashoffset={(2 * Math.PI * 12) * (1 - (score > 0 ? score : 4) / 100)} 
                        />
                      </svg>
                      <span className="absolute text-[8px] font-black font-mono text-[var(--foreground)]">
                        {score > 0 ? `${score}%` : "0%"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-left shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground)]">
                        {score >= 80 ? "Mastery" : score > 0 ? "Incomplete" : "Get Started"}
                      </span>
                      <span className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest leading-none">
                        {score >= 80 ? "Sprint Passed" : score > 0 ? "Needs Review" : "No active session"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {onShare && (
                      <button
                        type="button"
                        onClick={() => onShare(nb.id)}
                        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-all"
                        title="Share Notebook"
                      >
                        <Share2 size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(nb.id)}
                        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-all"
                        title="Delete Notebook"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(`/library/pack/${nb.id}`)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--blue)] text-[var(--foreground)] text-xs font-bold group-hover:bg-[var(--blue)] group-hover:text-white transition-all shadow-sm"
                    >
                      <span>Study Workspace</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default NotebooksTable;
