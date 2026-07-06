"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  BookOpen, 
  PlusCircle, 
  LayoutDashboard, 
  Users, 
  Settings, 
  Sparkles, 
  Moon, 
  Sun, 
  ArrowRight,
  Command
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface CommandItem {
  id: string;
  label: string;
  category: "Navigation" | "Study Actions" | "Ergonomics";
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CommandPalette({ isOpen: externalIsOpen, onClose: externalOnClose }: CommandPaletteProps = {}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) externalOnClose();
    if (!isControlled) setInternalIsOpen(false);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isControlled) {
          if (externalOnClose && isOpen) externalOnClose();
        } else {
          setInternalIsOpen((prev) => !prev);
        }
      }
    };

    const handleCustomOpen = () => {
      if (!isControlled) setInternalIsOpen(true);
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isControlled, isOpen, externalOnClose]);

  const items: CommandItem[] = [
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      category: "Navigation",
      icon: <LayoutDashboard size={16} className="text-[var(--blue)]" />,
      shortcut: "G D",
      onSelect: () => { router.push("/dashboard"); handleClose(); }
    },
    {
      id: "nav-library",
      label: "Go to Study Library",
      category: "Navigation",
      icon: <BookOpen size={16} className="text-[var(--violet)]" />,
      shortcut: "G L",
      onSelect: () => { router.push("/library"); handleClose(); }
    },
    {
      id: "nav-arena",
      label: "Go to Arena Pomodoro Lobbies",
      category: "Navigation",
      icon: <Users size={16} className="text-[var(--cyan)]" />,
      shortcut: "G A",
      onSelect: () => { router.push("/arena"); handleClose(); }
    },
    {
      id: "nav-settings",
      label: "Go to Ergonomics & Settings",
      category: "Navigation",
      icon: <Settings size={16} className="text-[var(--foreground-muted)]" />,
      shortcut: "G S",
      onSelect: () => { router.push("/settings"); handleClose(); }
    },
    {
      id: "action-create",
      label: "Create New Study Notebook",
      category: "Study Actions",
      icon: <PlusCircle size={16} className="text-[var(--emerald)]" />,
      shortcut: "C N",
      onSelect: () => { router.push("/dashboard?action=upload"); handleClose(); }
    },
    {
      id: "action-synthesize",
      label: "Synthesize Raw Notes with AI",
      category: "Study Actions",
      icon: <Sparkles size={16} className="text-[var(--amber)]" />,
      shortcut: "S N",
      onSelect: () => { router.push("/dashboard?action=paste"); handleClose(); }
    },
    {
      id: "ergo-theme",
      label: `Switch Theme (${theme === "dark" ? "Light" : "Dark"} Mode)`,
      category: "Ergonomics",
      icon: theme === "dark" ? <Sun size={16} className="text-[var(--amber)]" /> : <Moon size={16} className="text-[var(--blue)]" />,
      shortcut: "T M",
      onSelect: () => { setTheme(theme === "dark" ? "light" : "dark"); handleClose(); }
    }
  ];

  const filteredItems = query.trim() === ""
    ? items
    : items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        filteredItems[selectedIndex].onSelect();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-[var(--background)] border border-[var(--border-2)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--border)] bg-[var(--surface)]">
          <Search size={18} className="text-[var(--foreground-muted)] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search study actions..."
            className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-medium text-[var(--foreground-muted)] bg-[var(--background)] border border-[var(--border)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--border)]/50">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--foreground-muted)]">
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            ["Navigation", "Study Actions", "Ergonomics"].map((category) => {
              const catItems = filteredItems.filter(i => i.category === category);
              if (catItems.length === 0) return null;
              return (
                <div key={category} className="py-1.5 first:pt-0 last:pb-0">
                  <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--foreground-muted)]">
                    {category}
                  </div>
                  {catItems.map((item) => {
                    const idx = filteredItems.indexOf(item);
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={item.onSelect}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                          isSelected 
                            ? "bg-[var(--blue)]/15 text-[var(--foreground)] border border-[var(--blue)]/30" 
                            : "text-[var(--foreground-secondary)] hover:bg-[var(--surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                            {item.icon}
                          </div>
                          <span className="text-sm font-medium truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.shortcut && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)]">
                              {item.shortcut}
                            </span>
                          )}
                          <ArrowRight size={14} className={`transition-opacity ${isSelected ? "opacity-100 text-[var(--blue)]" : "opacity-0"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--surface)]/50 text-[11px] text-[var(--foreground-muted)]">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-[var(--background)] px-1 py-0.5 rounded border border-[var(--border)]">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono bg-[var(--background)] px-1 py-0.5 rounded border border-[var(--border)]">↵</kbd> select</span>
          </div>
          <div className="flex items-center gap-1">
            <Command size={12} />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
