"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import BrandLogo from "@/components/ui/BrandLogo";
import KnowledgeIngestModal from "@/components/modals/KnowledgeIngestModal";
import { useIngestStore } from "@/store/useIngestStore";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════
   TYPES & HELPERS
   ═══════════════════════════════════════════════════ */
interface Thread {
    id: string;
    title: string;
    updatedAt: Date;
    type: "chat" | "quiz" | "flashcards" | "summary";
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return "Still at it?";
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Afternoon,";
    if (hour < 21) return "Evening,";
    return "Late-night session,";
}

const SUB_GREETINGS = [
    "What are we working on today?",
    "Ready to dive into something?",
    "Let's get into it.",
    "Pick up where you left off, or start fresh.",
];

const typeIcons: Record<string, { icon: string; color: string }> = {
    chat: { icon: "chat_bubble", color: "#818CF8" },
    quiz: { icon: "quiz", color: "#F59E0B" },
    flashcards: { icon: "style", color: "#10B981" },
    summary: { icon: "summarize", color: "#6366F1" },
};

const SUGGESTIONS = [
    "Quiz me on my notes",
    "Make me flashcards from this chapter",
    "Summarize this for me",
    "Explain this concept simply",
];

/* ═══ Claymorphic style helpers ═══ */
const clay = {
    card: {
        background: "rgba(255,255,255,0.025)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
    input: {
        background: "rgba(255,255,255,0.03)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25), inset 0 -1px 1px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function HomePage() {
    const { user } = useUser();
    const { isProcessing, openModal } = useIngestStore();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [activeThread, setActiveThread] = useState<string | null>(null);
    const [subGreeting] = useState(() => SUB_GREETINGS[Math.floor(Math.random() * SUB_GREETINGS.length)]);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { 
        setMounted(true);
        if (user.id) {
            const fetchHistory = async () => {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("generations")
                    .select("id, title, type, created_at")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(10);
                if (!error && data) setHistory(data);
                setLoadingHistory(false);
            };
            fetchHistory();
        }
    }, [user.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = async (text?: string) => {
        const content = text || inputValue;
        if (!content.trim() || isTyping) return;

        const userMsg = { role: "user", content: content.trim() };
        const newMessages = [...messages, userMsg];
        
        setMessages(newMessages);
        setInputValue("");
        setIsTyping(true);
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.focus();
        }

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!response.ok) throw new Error("Failed to connect to The Professor");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantMsg = { role: "assistant", content: "" };
            
            setMessages(prev => [...prev, assistantMsg]);

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                assistantMsg.content += chunk;
                
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    { ...assistantMsg }
                ]);
            }
        } catch (err: any) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I encountered an issue while thinking. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!mounted) {
        return (
            <div className="h-[100dvh] bg-[#06060B] flex">
                <div className="w-[280px] bg-[#0A0A14] hidden md:block" />
                <div className="flex-1" />
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-[#06060B] text-white/90 flex overflow-hidden">
            {/* Mobile overlay */}
            {mobileSidebar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileSidebar(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    ${mobileSidebar ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0
                    ${sidebarOpen ? "md:w-[280px]" : "md:w-0 md:overflow-hidden"}
                    fixed md:relative z-50 md:z-auto
                    w-[280px] h-full flex-shrink-0
                    transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                    bg-[#0A0A14] border-r border-white/5
                `}
            >
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center justify-between mb-8">
                        <BrandLogo />
                        <button onClick={() => setSidebarOpen(false)} className="hidden md:block text-white/20 hover:text-white/40">
                            <span className="material-symbols-outlined text-[18px]">left_panel_close</span>
                        </button>
                    </div>

                    <Link href="/create" className="group p-3 rounded-2xl bg-[#F59E0B] text-[#08080E] font-bold flex items-center gap-3 mb-8 transition-transform active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span className="text-[14px]">New Study Piece</span>
                    </Link>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 px-2">Recent Thinking</p>
                        {loadingHistory ? (
                            <div className="flex flex-col gap-2 p-2">
                                {[1, 2, 3].map(n => <div key={n} className="h-10 rounded-xl bg-white/5 animate-pulse" />)}
                            </div>
                        ) : history.length > 0 ? (
                            history.map((item) => (
                                <Link 
                                    key={item.id} 
                                    href={`/${item.type}/${item.id}`}
                                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]" style={{ color: typeIcons[item.type]?.color }}>
                                        {typeIcons[item.type]?.icon}
                                    </span>
                                    <span className="text-[13px] font-medium truncate flex-1 opacity-60 group-hover:opacity-100 transition-opacity">{item.title}</span>
                                </Link>
                            ))
                        ) : (
                            <p className="p-4 text-[12px] text-white/10 italic text-center">Your knowledge library is empty.</p>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative min-w-0">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 relative z-20">
                    <div className="flex items-center gap-2">
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="hidden md:block text-white/20 hover:text-white/40 mr-2">
                                <span className="material-symbols-outlined text-[18px]">left_panel_open</span>
                            </button>
                        )}
                        <button onClick={() => setMobileSidebar(true)} className="md:hidden text-white/40">
                            <span className="material-symbols-outlined text-[18px]">menu</span>
                        </button>
                        <span className="text-[12px] font-semibold text-white/20">{activeThread ? "Conversation" : "New Chat"}</span>
                    </div>

                    <AnimatePresence>
                        {isProcessing && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                onClick={openModal}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                            >
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest hidden sm:inline">Learning...</span>
                                <Loader2 className="w-3 h-3 text-[#F59E0B] animate-spin" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </header>

                {/* Chat / Welcome View */}
                <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="w-full max-w-2xl mx-auto flex flex-col items-center px-6">
                        
                        {/* Welcome State */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center">
                                <div className="relative mb-8">
                                    <div className="w-16 h-16 rounded-3xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shadow-2xl shadow-[#F59E0B]/5">
                                        <span className="material-symbols-outlined text-[32px] text-[#F59E0B]">school</span>
                                    </div>
                                    <div className="absolute inset-0 -m-1 rounded-[28px] border border-[#F59E0B]/5 animate-pulse" />
                                </div>
                                <h1 className="text-[28px] font-bold text-white/90 mb-2 text-center">{getGreeting()} {user.name?.split(" ")[0]}.</h1>
                                <p className="text-[14px] text-white/30 mb-8 text-center">{subGreeting}</p>

                                <div className="flex flex-wrap gap-2.5 justify-center mb-12">
                                    {SUGGESTIONS.map((text, i) => (
                                        <button key={i} onClick={() => handleSendMessage(text)} className="px-5 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[13px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-all active:scale-95">
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        {messages.length > 0 && (
                            <div 
                                ref={scrollRef}
                                className="w-full h-full max-h-[60vh] flex flex-col gap-6 overflow-y-auto pr-4 custom-scrollbar mb-8"
                            >
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">school</span>
                                            </div>
                                        )}
                                        <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/10' : 'bg-white/[0.03] border border-white/5 text-white/80'}`}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && messages[messages.length-1]?.role === 'user' && (
                                     <div className="flex gap-4 justify-start">
                                        <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
                                            <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
                                        </div>
                                        <div className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-white/20 animate-pulse">Thinking...</span>
                                        </div>
                                     </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="w-full max-w-2xl mx-auto px-6 pb-12">
                        <div style={clay.input} className="p-3">
                            <div className="flex items-end gap-2">
                                <button onClick={openModal} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/20 hover:text-white/40 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                                </button>
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                    placeholder="Talk to The Professor..."
                                    rows={1}
                                    className="flex-1 bg-transparent border-none outline-none resize-none py-2 text-[14px] text-white/80 placeholder:text-white/15 max-h-32"
                                    onInput={(e) => {
                                        const t = e.target as HTMLTextAreaElement;
                                        t.style.height = "auto";
                                        t.style.height = Math.min(t.scrollHeight, 128) + "px";
                                    }}
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F59E0B] text-[#08080E] disabled:opacity-20 transition-all active:scale-90"
                                >
                                    {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-[18px]">arrow_upward</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <KnowledgeIngestModal />
        </div>
    );
}
