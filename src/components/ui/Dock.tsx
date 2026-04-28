"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useIngestStore } from "@/store/useIngestStore";
import { LayoutDashboard, Library, Plus, UserCircle } from "lucide-react";

export default function Dock() {
    const pathname = usePathname();
    const { openModal } = useIngestStore();

    // Hide the dock on focus-canvas routes (quizzes, flashcards, summaries)
    const isFocusRoute = pathname?.startsWith("/quiz/") || 
                         pathname?.startsWith("/flashcards/") || 
                         pathname?.startsWith("/summary/");

    // Hide dock on landing page, login, signup
    const isGlobalNavHidden = pathname === "/" || 
                              pathname === "/login" || 
                              pathname === "/signup" ||
                              isFocusRoute;

    if (isGlobalNavHidden) return null;

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
            <div className="flex items-center gap-1 p-2 rounded-[24px] bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                
                {/* Home/Dashboard */}
                <Link href="/dashboard" className="relative group p-3 rounded-2xl hover:bg-white/10 transition-colors">
                    {isActive("/dashboard") && (
                        <motion.div layoutId="dock-indicator" className="absolute inset-0 bg-[#F59E0B]/20 rounded-2xl z-0" />
                    )}
                    <LayoutDashboard 
                        size={24} 
                        strokeWidth={isActive("/dashboard") ? 2 : 1.5}
                        className={`relative z-10 transition-colors ${isActive("/dashboard") ? "text-[#F59E0B]" : "text-white/40 group-hover:text-white/80"}`} 
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/10 backdrop-blur-md rounded-md text-[10px] uppercase font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Home</div>
                </Link>

                {/* Library (Generations) */}
                <Link href="/library" className="relative group p-3 rounded-2xl hover:bg-white/10 transition-colors">
                    {isActive("/library") && (
                        <motion.div layoutId="dock-indicator" className="absolute inset-0 bg-[#F59E0B]/20 rounded-2xl z-0" />
                    )}
                    <Library 
                        size={24} 
                        strokeWidth={isActive("/library") ? 2 : 1.5}
                        className={`relative z-10 transition-colors ${isActive("/library") ? "text-[#F59E0B]" : "text-white/40 group-hover:text-white/80"}`} 
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/10 backdrop-blur-md rounded-md text-[10px] uppercase font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Library</div>
                </Link>

                {/* Create Trigger */}
                <button 
                    onClick={openModal}
                    className="relative group p-3 mx-1 rounded-[20px] bg-gradient-to-tr from-[#F59E0B] to-[#FCD34D] shadow-lg shadow-[#F59E0B]/20 hover:shadow-[#F59E0B]/40 hover:-translate-y-1 transition-all active:scale-95"
                >
                    <Plus size={24} strokeWidth={2.5} className="text-[#08080E]" />
                </button>

                {/* Profile / Settings */}
                <Link href="/profile" className="relative group p-3 rounded-2xl hover:bg-white/10 transition-colors">
                    {isActive("/profile") && (
                        <motion.div layoutId="dock-indicator" className="absolute inset-0 bg-white/10 rounded-2xl z-0" />
                    )}
                    <UserCircle 
                        size={24} 
                        strokeWidth={isActive("/profile") ? 2 : 1.5}
                        className={`relative z-10 transition-colors ${isActive("/profile") ? "text-white/90" : "text-white/40 group-hover:text-white/80"}`} 
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/10 backdrop-blur-md rounded-md text-[10px] uppercase font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Profile</div>
                </Link>

            </div>
        </motion.div>
    );
}
