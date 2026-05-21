"use client";

import { useState, useEffect } from "react";
import { Download, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ProfessorOffline", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("savedPacks")) {
        db.createObjectStore("savedPacks", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

interface SaveOfflineButtonProps {
  packId: string;
  title: string;
  type?: string;
  className?: string;
}

export default function SaveOfflineButton({ packId, title, type = "study_pack", className }: SaveOfflineButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status !== "saving") return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [status]);

  const handleSave = async () => {
    if (status === "saved") return;
    setStatus("saving");
    setProgress(10);
    try {
      const db = await openDB();
      const tx = db.transaction("savedPacks", "readwrite");
      const store = tx.objectStore("savedPacks");
      store.put({
        id: packId,
        title,
        type,
        savedAt: new Date().toISOString(),
      });
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      setProgress(100);
      setStatus("saved");
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 3000);
    } catch {
      setStatus("idle");
      setProgress(0);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={status === "saving"}
      className={cn(
        "relative overflow-hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm",
        status === "saved"
          ? "bg-[var(--emerald-dim)] text-[var(--emerald)] border border-[var(--emerald-border)]"
          : "bg-[var(--bg-3)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--bg-4)]",
        className
      )}
    >
      {status === "saving" && (
        <div
          className="absolute inset-0 bg-[var(--blue)]/10 transition-all duration-150 z-0"
          style={{ width: `${progress}%` }}
        />
      )}
      <div className="relative z-10 flex items-center gap-2">
        {status === "saving" ? (
          <Loader2 size={14} className="animate-spin text-[var(--blue)]" />
        ) : status === "saved" ? (
          <CheckCircle2 size={14} />
        ) : (
          <Download size={14} />
        )}
        <span>
          {status === "saving"
            ? `Saving (${progress}%)`
            : status === "saved"
            ? "Saved for Offline"
            : "Save for Offline"}
        </span>
      </div>
    </button>
  );
}