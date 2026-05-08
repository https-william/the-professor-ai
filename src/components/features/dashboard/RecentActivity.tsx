"use client";

import { motion } from "framer-motion";
import { History, GraduationCap, Layers, HelpCircle, FileText, Map as MapIcon, BookText } from "lucide-react";
import Link from "next/link";

interface RecentActivityProps {
    activities: {
        id: string;
        title: string;
        type: string;
        createdAt: string;
    }[];
}

function getTypeIcon(type: string): any {
    switch (type) {
        case "flashcards": return Layers;
        case "quiz": return HelpCircle;
        case "summary": return FileText;
        case "roadmap": return MapIcon;
        default: return BookText;
    }
}

function getTypeColor(type: string): string {
    switch (type) {
        case "flashcards": return "var(--blue)";
        case "quiz": return "var(--cyan)";
        case "summary": return "var(--amber)";
        case "roadmap": return "var(--crimson)";
        default: return "var(--text-3)";
    }
}
 
function getTypeLabel(type: string): string {
    switch (type) {
        case "flashcards": return "Flashcards";
        case "quiz": return "Quiz";
        case "summary": return "Summary";
        case "roadmap": return "Roadmap";
        default: return type;
    }
}
 
function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
 
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
 
export default function RecentActivity({ activities }: RecentActivityProps) {
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center font-sans bg-[var(--text)]/[0.02] rounded-[32px] border border-dashed border-[var(--border)]">
                <GraduationCap size={32} strokeWidth={1} className="text-[var(--text-3)]/30 mb-4" />
                <p className="text-[11px] font-black text-[var(--text-3)] uppercase tracking-widest">No Recent Archives</p>
                <Link href="/create" className="mt-4 text-[10px] font-black text-[var(--blue)] hover:underline tracking-tighter italic">
                    BEGIN SCHOLARLY JOURNEY →
                </Link>
            </div>
        );
    }
 
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                {activities.slice(0, 4).map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="font-sans"
                    >
                        <Link
                            href={`/${item.type === "quiz" ? "quiz" : item.type === "summary" ? "summary" : "flashcards"}?id=${item.id}`}
                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--text)]/5 transition-all group border border-transparent hover:border-[var(--border)]"
                        >
                            <div className="w-10 h-10 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] flex items-center justify-center shrink-0 group-hover:border-[var(--blue)]/30 transition-colors">
                                {(() => {
                                    const IconComp = getTypeIcon(item.type);
                                    return <IconComp size={16} strokeWidth={2} className="text-[var(--text-3)] group-hover:text-[var(--blue)] transition-colors" />;
                                })()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black text-[var(--text)] truncate transition-colors">{item.title}</p>
                                <p className="text-[9px] text-[var(--text-3)] font-black uppercase tracking-[0.2em] mt-0.5 opacity-60">
                                    {getTypeLabel(item.type)}
                                </p>
                            </div>
                            <span className="text-[10px] text-[var(--text-3)]/60 font-black tracking-tighter italic shrink-0">
                                {formatRelativeTime(item.createdAt)}
                            </span>
                        </Link>
                    </motion.div>
                ))}
            </div>
            
            <Link href="/library" className="block w-full py-3 text-center rounded-xl bg-[var(--bg-2)]/50 hover:bg-[var(--bg-2)] border border-[var(--border)] text-[9px] font-black text-[var(--text-3)] uppercase tracking-[0.3em] transition-all">
                Full Archives
            </Link>
        </div>
    );
}
