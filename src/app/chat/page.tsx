"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import KnowledgeIngestModal from "@/components/modals/KnowledgeIngestModal";
import { useIngestStore } from "@/store/useIngestStore";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════
   TYPES & HELPERS
   ═══════════════════════════════════════════════════ */
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

const SUGGESTIONS = [
    "Quiz me on my notes",
    "Make me flashcards from this chapter",
    "Summarize this for me",
    "Explain this concept simply",
];

const clay = {
    input: {
        background: "var(--card-bg, rgba(255,255,255,0.03))",
        borderRadius: "16px",
        border: "1px solid var(--border, rgba(255,255,255,0.06))",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25), inset 0 -1px 1px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
};

function ChatTool() {
    const router = useRouter();
    const { user } = useUser();
    const { isProcessing, openModal } = useIngestStore();
    const [mounted, setMounted] = useState(false);
    
    // Core Chat State
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    
    const searchParams = useSearchParams();
    const [activeThread, setActiveThread] = useState<string | null>(null);
    const [subGreeting] = useState(() => SUB_GREETINGS[Math.floor(Math.random() * SUB_GREETINGS.length)]);
    
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    // Load thread from URL
    useEffect(() => {
        if (!user.id) return;
        const threadParam = searchParams.get('t');
        if (threadParam) loadThread(threadParam);
    }, [user.id, searchParams]);

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
            <div className="h-[100dvh] bg-[var(--background)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-[var(--background)] text-[var(--foreground)] flex flex-col overflow-hidden relative">
            
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[600px] h-[600px] rounded-full animate-pulse"
                    style={{ top: "-10%", left: "-10%", background: "radial-gradient(circle, rgba(52, 211, 153, 0.05), transparent 60%)", filter: "blur(80px)", animationDuration: "8s" }} />
            </div>

            <div className="mx-auto flex justify-center py-4">
                {/* Header Slot Placeholder or direct back button if needed */}
            </div>

            <main className="flex-1 flex flex-col relative min-w-0 pt-24 md:pt-16 overflow-hidden h-full z-10 w-full max-w-4xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col items-center relative overflow-hidden"
                >
                    <div className="w-full flex-1 flex flex-col px-4 md:px-8 min-h-0 pt-4">
                        
                        {/* Welcome State */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center mt-12 md:mt-24">
                                <div className="relative mb-8">
                                    <div className="w-16 h-16 rounded-3xl bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center shadow-2xl shadow-[#34D399]/5">
                                        <span className="material-symbols-outlined text-[32px] text-[#34D399]">forum</span>
                                    </div>
                                    <div className="absolute inset-0 -m-1 rounded-[28px] border border-[#34D399]/5 animate-pulse" />
                                </div>
                                <h1 className="text-[28px] font-bold mb-2 text-center text-[var(--foreground)]">{getGreeting()} {user.name?.split(" ")[0]}.</h1>
                                <p className="text-[14px] text-[var(--foreground-muted)] mb-8 text-center">{subGreeting}</p>

                                <div className="flex flex-wrap gap-2.5 justify-center mb-12">
                                    {SUGGESTIONS.map((text, i) => (
                                        <button key={i} onClick={() => handleSendMessage(text)} className="px-5 py-2.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] text-[13px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-hover)] transition-all active:scale-95 shadow-sm">
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
                                        className={`flex gap-4 md:gap-5 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start mb-6'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-10 h-10 rounded-2xl bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center shrink-0 select-none mt-0.5 shadow-sm">
                                                <span className="material-symbols-outlined text-[20px] text-[#34D399] select-none pointer-events-none">school</span>
                                            </div>
                                        )}
                                        <div className={`leading-relaxed max-w-[90%] md:max-w-[75%] ${
                                            msg.role === 'user' 
                                            ? 'px-5 py-3.5 rounded-[24px] rounded-br-[8px] bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] text-[15px] shadow-sm' 
                                            : 'text-[var(--foreground)] text-[15px] pt-1 flex-1'
                                        }`}>
                                            {msg.role === 'user' ? (
                                                msg.content
                                            ) : (
                                                <div className="markdown-prose w-full">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                        {typeof msg.content === 'string' ? msg.content.replace(/[ \t]+:[ \t]*/g, ': ').replace(/:[ \t]+/g, ': ') : msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && messages[messages.length-1]?.role === 'user' && (
                                        <div className="flex gap-4 justify-start">
                                        <div className="w-10 h-10 rounded-2xl bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center shrink-0 shadow-sm">
                                            <Loader2 className="w-5 h-5 animate-spin text-[#34D399]" />
                                        </div>
                                        <div className="px-5 py-3 rounded-[24px] rounded-bl-[8px] bg-[var(--card-bg)] border border-[var(--border)] flex items-center shadow-sm">
                                            <span className="text-[11px] uppercase font-bold tracking-widest text-[var(--foreground-muted)] animate-pulse">Thinking...</span>
                                        </div>
                                        </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="w-full mx-auto px-4 md:px-0 pb-6 md:pb-12 pt-4 shrink-0 relative z-30">
                        <div style={clay.input} className="p-2 sm:p-3">
                            <div className="flex items-end gap-2">
                                <button onClick={openModal} className="w-10 h-10 rounded-xl bg-[var(--card-bg)] flex items-center justify-center hover:bg-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors shadow-sm cursor-pointer">
                                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                                </button>
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                    placeholder="Ask anything..."
                                    rows={1}
                                    className="flex-1 bg-transparent border-none outline-none resize-none py-2 px-2 text-[15px] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] max-h-32"
                                    onInput={(e) => {
                                        const t = e.target as HTMLTextAreaElement;
                                        t.style.height = "auto";
                                        t.style.height = Math.min(t.scrollHeight, 128) + "px";
                                    }}
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#34D399] text-[#000] disabled:opacity-20 transition-all active:scale-90 shadow-[0_4px_12px_rgba(52,211,153,0.3)] hover:shadow-[0_6px_16px_rgba(52,211,153,0.4)]"
                                >
                                    {isTyping ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <span className="material-symbols-outlined text-[20px] text-black">send</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
            
            <KnowledgeIngestModal />
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-[100dvh] bg-[var(--background)] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#34D399] animate-spin" /></div>}>
            <ChatTool />
        </Suspense>
    );
}
