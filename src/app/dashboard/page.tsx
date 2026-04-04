"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
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
const typeConfig: Record<string, { icon: string; color: string; bg: string; border: string; glow: string }> = {
    chat: { 
        icon: "chat_bubble", 
        color: "#818CF8", 
        bg: "rgba(129, 140, 248, 0.1)", 
        border: "rgba(129, 140, 248, 0.2)",
        glow: "0 8px 32px rgba(129, 140, 248, 0.2)"
    },
    flashcards: { 
        icon: "style", 
        color: "#10B981", 
        bg: "rgba(16, 185, 129, 0.1)", 
        border: "rgba(16, 185, 129, 0.2)",
        glow: "0 8px 32px rgba(16, 185, 129, 0.2)"
    },
    quiz: { 
        icon: "quiz", 
        color: "#F59E0B", 
        bg: "rgba(245, 158, 11, 0.1)", 
        border: "rgba(245, 158, 11, 0.2)",
        glow: "0 8px 32px rgba(245, 158, 11, 0.2)"
    },
    summary: { 
        icon: "summarize", 
        color: "#3B82F6", 
        bg: "rgba(59, 130, 246, 0.1)", 
        border: "rgba(59, 130, 246, 0.2)",
        glow: "0 8px 32px rgba(59, 130, 246, 0.2)"
    }
};

interface Thread {
    id: string;
    title: string;
    created_at: string;
    type: string;
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
    const router = useRouter();
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
    const [appMode, setAppMode] = useState<"CHAT" | "CREATE">("CHAT");
    const [activeThread, setActiveThread] = useState<string | null>(null);
    const [subGreeting] = useState(() => SUB_GREETINGS[Math.floor(Math.random() * SUB_GREETINGS.length)]);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { 
        setMounted(true);
        if (user.id) {
            const fetchHistory = async () => {
                setLoadingHistory(true);
                const supabase = createClient();
                if (appMode === "CHAT") {
                    const { data, error } = await supabase
                        .from("chat_threads")
                        .select("id, title, created_at")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(20);
                    if (!error && data) setHistory(data.map(d => ({ ...d, type: "chat" })));
                } else {
                    const { data, error } = await supabase
                        .from("generations")
                        .select("id, title, type, created_at")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(20);
                    if (!error && data) setHistory(data);
                }
                setLoadingHistory(false);
            };
            fetchHistory();

            // Check if threadId inside URL initially
            const urlParams = new URLSearchParams(window.location.search);
            const threadParam = urlParams.get('t');
            if (threadParam) {
                loadThread(threadParam);
            }
        } // Close if (user.id)
    }, [user.id, appMode]);

    const loadThread = async (threadId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("chat_messages")
            .select("role, content")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: true });
            
        if (!error && data) {
            setMessages(data);
            setActiveThread(threadId);
            window.history.pushState(null, '', `?t=${threadId}`);
        }
    };

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
        
        let currentThreadId = activeThread;
        if (!currentThreadId) {
            currentThreadId = crypto.randomUUID();
            setActiveThread(currentThreadId);
            // Optionally push state so refreshing doesn't lose the thread context immediately
            window.history.replaceState(null, '', `?t=${currentThreadId}`);
        }

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
                body: JSON.stringify({ messages: newMessages, threadId: currentThreadId }),
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

                    <button 
                        onClick={() => {
                            if (appMode === "CHAT") {
                                setMessages([]);
                                setActiveThread(null);
                                window.history.pushState(null, '', window.location.pathname);
                            } else {
                                router.push('/create');
                            }
                            if (window.innerWidth < 768) setMobileSidebar(false);
                        }} 
                        className="group p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white/90 font-bold flex items-center justify-between gap-3 mb-6 hover:bg-white/[0.06] hover:border-white/10 transition-all active:scale-95 w-full shadow-inner"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[18px] text-[#3B82F6]">add</span>
                            <span className="text-[13px] tracking-wide">{appMode === "CHAT" ? "New Conversation" : "New Resource"}</span>
                        </div>
                        <span className="material-symbols-outlined text-[14px] text-white/20 group-hover:text-white/60 transition-colors">edit_square</span>
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 px-2">
                            {appMode === "CHAT" ? "Chat History" : "Your Library"}
                        </p>
                        {loadingHistory ? (
                            <div className="flex flex-col gap-2 p-2">
                                {[1, 2, 3].map(n => <div key={n} className="h-10 rounded-xl bg-white/5 animate-pulse" />)}
                            </div>
                        ) : history.length > 0 ? (
                            history.map((item) => (
                                <button 
                                    key={item.id} 
                                    onClick={() => {
                                        if (appMode === "CHAT") {
                                            loadThread(item.id);
                                        } else {
                                            router.push(`/${item.type}?id=${item.id}`);
                                        }
                                        if (window.innerWidth < 768) setMobileSidebar(false);
                                    }} 
                                    className={`group w-full flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                                        (activeThread === item.id) 
                                            ? "bg-white/[0.08] border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)]" 
                                            : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/5"
                                    }`}
                                >
                                    <div 
                                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110"
                                        style={{ 
                                            backgroundColor: typeConfig[item.type]?.bg || 'rgba(255,255,255,0.05)',
                                            color: typeConfig[item.type]?.color || '#888',
                                            border: `1px solid ${typeConfig[item.type]?.border || 'transparent'}`
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {typeConfig[item.type]?.icon || 'chat_bubble'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 text-left overflow-hidden">
                                        <p className={`text-[13.5px] font-semibold truncate transition-colors ${
                                            activeThread === item.id ? "text-white" : "text-white/40 group-hover:text-white/90"
                                        }`}>
                                            {item.title || "Untitled Session"}
                                        </p>
                                        <p className="text-[9px] text-white/15 font-black uppercase tracking-[0.2em] mt-0.5 group-hover:text-white/30 transition-colors">
                                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pr-1">
                                        <span className="material-symbols-outlined text-[14px] text-white/20">arrow_forward_ios</span>
                                    </div>

                                    {/* Selection Glow */}
                                    {activeThread === item.id && (
                                        <div 
                                            className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-full animate-pulse" 
                                            style={{ backgroundColor: typeConfig[item.type]?.color || '#fff' }}
                                        />
                                    )}
                                </button>
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
                    <div className="flex items-center gap-2 relative z-20">
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="hidden md:block text-white/20 hover:text-white/40 mr-2">
                                <span className="material-symbols-outlined text-[18px]">left_panel_open</span>
                            </button>
                        )}
                        <button onClick={() => setMobileSidebar(true)} className="md:hidden text-white/40">
                            <span className="material-symbols-outlined text-[18px]">menu</span>
                        </button>
                    </div>

                    {/* The Mode Toggle Pill */}
                    <div 
                        className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#06060B] rounded-full p-1 border border-white/[0.08] z-30 w-[300px]"
                        style={{ boxShadow: "inset 0 4px 6px -1px rgba(0,0,0,0.5), inset 0 2px 4px -2px rgba(0,0,0,0.5)" }}
                    >
                        <button 
                            onClick={() => setAppMode("CHAT")}
                            className={`flex-1 text-[12px] font-bold tracking-widest py-2.5 rounded-full transition-all duration-300 relative ${appMode === 'CHAT' ? 'text-white' : 'text-white/30 hover:text-white/80'}`}
                        >
                            {appMode === 'CHAT' && (
                                <motion.div 
                                    layoutId="mode-slider" 
                                    className="absolute inset-0 bg-[#3B82F6] rounded-full z-0"
                                    style={{
                                        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.3), 0 4px 16px rgba(59,130,246,0.3)"
                                    }}
                                />
                            )}
                            <span className="relative z-10 drop-shadow-lg">CHAT</span>
                        </button>
                        <button 
                            onClick={() => setAppMode("CREATE")}
                            className={`flex-1 text-[12px] font-bold tracking-widest py-2.5 rounded-full transition-all duration-300 relative ${appMode === 'CREATE' ? 'text-white' : 'text-white/30 hover:text-white/80'}`}
                        >
                            {appMode === 'CREATE' && (
                                <motion.div 
                                    layoutId="mode-slider" 
                                    className="absolute inset-0 bg-[#F59E0B] rounded-full z-0"
                                    style={{
                                        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.3), 0 4px 16px rgba(245,158,11,0.3)"
                                    }}
                                />
                            )}
                            <span className="relative z-10 drop-shadow-lg">CREATE</span>
                        </button>
                    </div>

                    <div className="w-10 relative z-20" /> {/* Spacer to balance header */}
                </header>

                {/* Dual-State Main View */}
                {appMode === "CREATE" ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F59E0B]/5 rounded-full blur-[120px] pointer-events-none" />
                        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mb-6 shadow-2xl shadow-[#F59E0B]/10">
                                <span className="material-symbols-outlined text-[32px] text-[#F59E0B]">auto_stories</span>
                            </div>
                            <h1 className="text-[32px] md:text-[40px] font-bold text-white mb-4">Build Your Knowledge Base.</h1>
                            <p className="text-[15px] md:text-[18px] text-white/40 mb-12 max-w-2xl leading-relaxed">
                                Upload your syllabi, textbooks, or notes. The Professor will instantly synthesize them into high-yield study resources.
                            </p>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-4xl mt-6">
                                <button 
                                    onClick={() => router.push('/create?tool=flashcards')} 
                                    className="group relative flex flex-col items-start p-9 rounded-[48px] bg-[#0A0A0F] transition-all duration-500 overflow-hidden active:scale-95 active:shadow-[inset_12px_12px_24px_rgba(0,0,0,0.5),inset_-8px_-8px_24px_rgba(255,255,255,0.01)]"
                                    style={{
                                        boxShadow: "16px 16px 32px rgba(0,0,0,0.6), -8px -8px 24px rgba(255,255,255,0.015)"
                                    }}
                                >
                                    <div 
                                        className="w-16 h-16 rounded-[28px] flex items-center justify-center mb-8 relative z-10 transition-all duration-700 group-hover:scale-110"
                                        style={{
                                            backgroundColor: typeConfig.flashcards.bg,
                                            boxShadow: `inset 4px 4px 12px rgba(0,0,0,0.3), inset -4px -4px 12px rgba(255,255,255,0.05), ${typeConfig.flashcards.glow}`
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-[28px]" style={{ color: typeConfig.flashcards.color }}>style</span>
                                    </div>

                                    <div className="relative z-10 text-left">
                                        <h3 className="text-white text-xl font-black mb-3 tracking-tight">Flashcards</h3>
                                        <p className="text-[14px] text-white/30 leading-relaxed font-medium">Spaced-repetition mastery. Instantly generate decks from any documents.</p>
                                    </div>

                                    {/* Subtle Soft Glow */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-transparent to-transparent opacity-0 group-hover:from-[#10B981]/5 transition-all duration-700" />
                                </button>

                                <button 
                                    onClick={() => router.push('/create?tool=quiz')} 
                                    className="group relative flex flex-col items-start p-9 rounded-[48px] bg-[#0A0A0F] transition-all duration-500 overflow-hidden active:scale-95 active:shadow-[inset_12px_12px_24px_rgba(0,0,0,0.5),inset_-8px_-8px_24px_rgba(255,255,255,0.01)]"
                                    style={{
                                        boxShadow: "16px 16px 32px rgba(0,0,0,0.6), -8px -8px 24px rgba(255,255,255,0.015)"
                                    }}
                                >
                                    <div 
                                        className="w-16 h-16 rounded-[28px] flex items-center justify-center mb-8 relative z-10 transition-all duration-700 group-hover:scale-110"
                                        style={{
                                            backgroundColor: typeConfig.quiz.bg,
                                            boxShadow: `inset 4px 4px 12px rgba(0,0,0,0.3), inset -4px -4px 12px rgba(255,255,255,0.05), ${typeConfig.quiz.glow}`
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-[28px]" style={{ color: typeConfig.quiz.color }}>quiz</span>
                                    </div>

                                    <div className="relative z-10 text-left">
                                        <h3 className="text-white text-xl font-black mb-3 tracking-tight">Quizzes</h3>
                                        <p className="text-[14px] text-white/30 leading-relaxed font-medium">Test your understanding with rigorous, context-aware assessments.</p>
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-transparent to-transparent opacity-0 group-hover:from-[#F59E0B]/5 transition-all duration-700" />
                                </button>

                                <button 
                                    onClick={() => router.push('/create?tool=summary')} 
                                    className="group relative flex flex-col items-start p-9 rounded-[48px] bg-[#0A0A0F] transition-all duration-500 overflow-hidden active:scale-95 active:shadow-[inset_12px_12px_24px_rgba(0,0,0,0.5),inset_-8px_-8px_24px_rgba(255,255,255,0.01)]"
                                    style={{
                                        boxShadow: "16px 16px 32px rgba(0,0,0,0.6), -8px -8px 24px rgba(255,255,255,0.015)"
                                    }}
                                >
                                    <div 
                                        className="w-16 h-16 rounded-[28px] flex items-center justify-center mb-8 relative z-10 transition-all duration-700 group-hover:scale-110"
                                        style={{
                                            backgroundColor: typeConfig.summary.bg,
                                            boxShadow: `inset 4px 4px 12px rgba(0,0,0,0.3), inset -4px -4px 12px rgba(255,255,255,0.05), ${typeConfig.summary.glow}`
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-[28px]" style={{ color: typeConfig.summary.color }}>summarize</span>
                                    </div>

                                    <div className="relative z-10 text-left">
                                        <h3 className="text-white text-xl font-black mb-3 tracking-tight">Summaries</h3>
                                        <p className="text-[14px] text-white/30 leading-relaxed font-medium">Distill complex papers down to their absolute core concepts.</p>
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-transparent to-transparent opacity-0 group-hover:from-[#3B82F6]/5 transition-all duration-700" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center relative overflow-hidden">
                        <div className="w-full max-w-4xl mx-auto flex flex-col px-4 md:px-8 flex-1 min-h-0 pt-8">
                            
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
                                    className="w-full flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-8 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                                >
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-5 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start mb-6'}`}
                                        >
                                            {msg.role === 'assistant' && (
                                                <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shrink-0 select-none mt-0.5">
                                                    <span className="material-symbols-outlined text-[20px] text-[#F59E0B] select-none pointer-events-none">school</span>
                                                </div>
                                            )}
                                            <div className={`leading-relaxed max-w-[85%] ${
                                                msg.role === 'user' 
                                                ? 'px-6 py-3.5 rounded-[28px] bg-white/[0.06] border border-white/[0.02] text-white/90 text-[15px]' 
                                                : 'text-white/90 text-[15px] pt-1 flex-1'
                                            }`}>
                                                {msg.role === 'user' ? (
                                                    msg.content
                                                ) : (
                                                    <div className="markdown-prose w-full">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
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
                        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-12 pt-4 shrink-0 relative z-30">
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
                )}
            </main>

            <KnowledgeIngestModal />
        </div>
    );
}
