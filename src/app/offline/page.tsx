"use client";

import { useState, useEffect } from "react";
import { WifiOff, BookOpen, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

interface SavedPack {
  id: string;
  title: string;
  savedAt: string;
  type: string;
}

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

async function getSavedPacks(): Promise<SavedPack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("savedPacks", "readonly");
    const store = tx.objectStore("savedPacks");
    const all = store.getAll();
    all.onsuccess = () => resolve(all.result || []);
    all.onerror = () => reject(all.error);
  });
}

export default function OfflinePage() {
  const [savedPacks, setSavedPacks] = useState<SavedPack[]>([]);

  useEffect(() => {
    getSavedPacks().then(setSavedPacks).catch(() => {});
  }, []);

  const handleDelete = async (id: string) => {
    const db = await openDB();
    const tx = db.transaction("savedPacks", "readwrite");
    tx.objectStore("savedPacks").delete(id);
    tx.oncomplete = () => {
      setSavedPacks((prev) => prev.filter((p) => p.id !== id));
    };
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center p-6">
      <div className="w-full max-w-lg mx-auto pt-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
            <ArrowLeft size={18} />
            <span className="text-[11px] font-black uppercase tracking-wider">Back</span>
          </Link>
          <BrandLogo size="sm" />
        </div>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-3)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
            <WifiOff className="w-8 h-8 text-[var(--foreground-muted)]" />
          </div>
          <h1 className="text-2xl font-black text-[var(--foreground)] mb-2 tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm font-medium">
            No worries. Your saved packs are right here.
          </p>
        </div>

        {savedPacks.length > 0 ? (
          <div className="space-y-3 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] px-1 mb-4">
              Saved for Offline ({savedPacks.length})
            </h2>
            {savedPacks.map((pack) => (
              <div
                key={pack.id}
                className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-[var(--blue)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--foreground)] truncate">
                      {pack.title}
                    </p>
                    <p className="text-[10px] text-[var(--foreground-muted)] font-medium">
                      Saved {new Date(pack.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/library/pack/${pack.id}`}
                    className="p-2 rounded-xl text-[var(--blue)] hover:bg-[var(--blue-dim)] transition-all"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(pack.id)}
                    className="p-2 rounded-xl text-[var(--crimson)] hover:bg-[var(--crimson-dim)] transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 rounded-[32px] bg-[var(--card)] border border-[var(--border)] mb-8">
            <BookOpen size={32} className="mx-auto mb-4 text-[var(--foreground-muted)] opacity-40" />
            <p className="text-[var(--foreground-muted)] text-sm font-medium mb-2">
              Nothing saved yet
            </p>
            <p className="text-[11px] text-[var(--foreground-muted)] opacity-60">
              When you&apos;re online, save study packs to access them here.
            </p>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3.5 rounded-2xl font-black text-[12px] uppercase tracking-wider bg-[var(--foreground)] text-[var(--background)] transition-all active:scale-[0.98] hover:opacity-90 mb-3"
        >
          Try Again
        </button>

        <Link
          href="/dashboard"
          className="block w-full py-3.5 rounded-2xl font-bold text-[12px] uppercase tracking-wider border border-[var(--border)] text-[var(--foreground)] text-center transition-all hover:bg-[var(--bg-3)]"
        >
          Go to Dashboard
        </Link>

        <p className="mt-12 text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest text-center opacity-40">
          The Professor | Your notes. Just the good parts.
        </p>
      </div>
    </div>
  );
}