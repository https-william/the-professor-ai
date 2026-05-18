"use client";

import { useState } from "react";
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

  const handleSave = async () => {
    if (status === "saved") return;
    setStatus("saving");
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
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={status === "saving"}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95",
        status === "saved"
          ? "bg-[var(--emerald-dim)] text-[var(--emerald)] border border-[var(--emerald-border)]"
          : "bg-[var(--bg-3)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--bg-4)]",
        className
      )}
    >
      {status === "saving" ? (
        <Loader2 size={14} className="animate-spin" />
      ) : status === "saved" ? (
        <CheckCircle2 size={14} />
      ) : (
        <Download size={14} />
      )}
      {status === "saved" ? "Saved for Offline" : "Save for Offline"}
    </button>
  );
}