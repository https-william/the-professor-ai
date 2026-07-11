"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { HeroIngestionDropzone } from "@/components/features/dashboard/HeroIngestionDropzone";
import { NotebooksTable, StudyNotebookSummary } from "@/components/features/dashboard/NotebooksTable";
import { useToasts } from "@/components/ui/GlobalToasts";
import { 
  Trophy, 
  Flame, 
  Zap, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ArrowRight,
  Lightbulb,
  ShieldAlert
} from "lucide-react";
import { getDailyTip } from "@/lib/education-tips";

interface DashboardCommandCenterProps {
  greeting: string;
  firstName: string;
  activityData: any;
  onFileSelect: (file: File) => void;
  onTextSubmit: (text: string, title?: string) => void;
  isProcessing?: boolean;
  processingText?: string;
  onLoadDemo?: (type: 'mitosis' | 'contract') => void;
}

export default function DashboardCommandCenter({
  greeting,
  firstName,
  activityData,
  onFileSelect,
  onTextSubmit,
  isProcessing = false,
  processingText,
  onLoadDemo
}: DashboardCommandCenterProps) {
  const router = useRouter();
  const { user } = useUser();
  const { addToast } = useToasts();
  const [notebooks, setNotebooks] = useState<StudyNotebookSummary[]>([]);
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(true);
  const [dailyTip, setDailyTip] = useState<string | null>(null);

  useEffect(() => {
    setDailyTip(getDailyTip(user?.id || "guest"));
  }, [user?.id]);

  useEffect(() => {
    async function loadNotebooks() {
      setIsLoadingNotebooks(true);
      const combined: StudyNotebookSummary[] = [];

      // Load offline notebooks
      try {
        const offlineObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
        Object.values(offlineObj).forEach((p: any) => {
          combined.push({
            id: p.id,
            title: p.title || "Untitled Study Notebook",
            summaryPreview: p.source_text ? p.source_text.substring(0, 120) + "..." : "Local AI Study Notebook",
            cardCount: p.phases_data?.flashcards?.length || 15,
            quizScore: p.phases_data?.quizScore || 0,
            updatedAt: new Date(p.savedAt || Date.now()).toLocaleDateString(),
            tags: ["Local", "AI Vault"]
          });
        });
      } catch (e) {
        console.error("Error loading local study packs:", e);
      }

      // Load cloud notebooks if authenticated
      if (user?.id) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("study_packs")
            .select("id, title, created_at, phases_data, source_text")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!error && data) {
            data.forEach((p: any) => {
              if (!combined.some(c => c.id === p.id)) {
                combined.push({
                  id: p.id,
                  title: p.title || "Untitled Study Notebook",
                  summaryPreview: p.source_text ? p.source_text.substring(0, 120) + "..." : "Cloud AI Study Notebook",
                  cardCount: p.phases_data?.flashcards?.length || 15,
                  quizScore: p.phases_data?.quizScore || 0,
                  updatedAt: new Date(p.created_at).toLocaleDateString(),
                  tags: ["Cloud"]
                });
              }
            });
          }
        } catch (e) {
          console.error("Error loading cloud study packs:", e);
        }
      }

      combined.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setNotebooks(combined);
      setIsLoadingNotebooks(false);
    }

    loadNotebooks();
  }, [user?.id]);

  const handleDeleteNotebook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notebook?")) return;
    try {
      const offlineObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
      if (offlineObj[id]) {
        delete offlineObj[id];
        localStorage.setItem("offline_study_packs", JSON.stringify(offlineObj));
      } else if (user?.id) {
        const supabase = createClient();
        await supabase.from("study_packs").delete().eq("id", id);
      }
      setNotebooks(prev => prev.filter(n => n.id !== id));
      addToast("Notebook deleted successfully.", "success");
    } catch (err) {
      addToast("Failed to delete notebook.", "error");
    }
  };

  const handleShareNotebook = (id: string) => {
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url);
    addToast("Study pack link copied to clipboard!", "success");
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border-2)] shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20">
              Study Lounge
            </span>
            {activityData?.streak > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                <Flame size={12} className="fill-current" />
                <span>{activityData.streak} Day Streak</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight font-heading">
            {greeting}, {firstName || "Scholar"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            Your study notes and practice questions are ready to go.
          </p>
        </div>
      </div>

      {/* Main Grid: Upload & Activity (Left), Focus & Notebooks (Right) */}
      <HeroIngestionDropzone
        onFileSelect={onFileSelect}
        onTextSubmit={onTextSubmit}
        isProcessing={isProcessing}
        processingText={processingText}
      />

      {/* Grid: Notebooks Table & Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Notebooks Table */}
        <div className="lg:col-span-2">
          <NotebooksTable
            notebooks={notebooks}
            isLoading={isLoadingNotebooks}
            onDelete={handleDeleteNotebook}
            onShare={handleShareNotebook}
            onLoadDemo={onLoadDemo}
          />
        </div>

        {/* Right Column: Daily Wisdom */}
        <div className="space-y-6">

          {dailyTip && (
            <div className="p-6 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-[var(--amber)]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)]">
                  Daily Study Tip
                </span>
              </div>
              <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed font-medium">
                &ldquo;{dailyTip}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
