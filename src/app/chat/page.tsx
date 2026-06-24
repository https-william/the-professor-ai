"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Markdown from "@/components/ui/Markdown";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import KnowledgeIngestModal from "@/components/modals/KnowledgeIngestModal";
import { useIngestStore } from "@/store/useIngestStore";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Loader2, MessageSquare, GraduationCap, Paperclip, Send, ArrowLeft, X } from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import SEOHead, { getWebApplicationSchema } from "@/components/SEOHead";

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
                <Loader2 className="w-8 h-8 text-[var(--violet)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-[var(--background)] text-[var(--foreground)] flex flex-col overflow-hidden relative">
            <SEOHead type="WebApplication" data={getWebApplicationSchema()} />
            
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[600px] h-[600px] rounded-full animate-pulse"
                    style={{ top: "-10%", left: "-10%", background: "radial-gradient(circle, rgba(150, 115, 245, 0.04), transparent 60%)", filter: "blur(80px)", animationDuration: "8s" }} />
            </div>

            {/* Back to Campus Bar */}
            <div className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-zinc-950/20 backdrop-blur-md z-30 flex items-center px-4 md:px-8">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)] hover:text-white transition-colors flex items-center gap-2 group cursor-pointer"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Campus</span>
                </button>
            </div>

            <main className="flex-1 flex flex-col relative min-w-0 pt-16 overflow-hidden h-full z-10 w-full max-w-4xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col items-center relative overflow-hidden"
                >
                    <div className="w-full flex-1 flex flex-col px-4 md:px-8 min-h-0 pt-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        
                        {/* Welcome State */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center mt-12 md:mt-20">
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 rounded-3xl bg-[var(--violet-dim)] border border-[var(--violet-border)] flex items-center justify-center shadow-2xl">
                                        <MessageSquare size={28} className="text-[var(--violet)]" />
                                    </div>
                                    <div className="absolute inset-0 -m-1 rounded-[28px] border border-[var(--violet-border)]/20 animate-pulse" />
                                </div>
                                <h1 className="text-[28px] font-heading font-black mb-2 text-center text-white tracking-tight italic uppercase">
                                    {getGreeting()} {user.name !== "Scholar" ? user.name?.split(" ")[0] : "Scholar"}.
                                </h1>
                                <p className="text-[14px] text-[var(--foreground-muted)] mb-8 text-center font-medium">{subGreeting}</p>

                                <div className="flex flex-wrap gap-2.5 justify-center mb-12">
                                    {SUGGESTIONS.map((text, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleSendMessage(text)} 
                                            className="px-5 py-3 rounded-2xl bg-zinc-950/45 border border-white/5 text-[12px] font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:text-white hover:border-white/10 transition-all active:scale-95 shadow-lg cursor-pointer"
                                        >
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
                                className="w-full flex-1 flex flex-col gap-6 pb-8 pt-4"
                            >
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-4 md:gap-5 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start mb-6'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-10 h-10 rounded-2xl bg-[var(--violet-dim)] border border-[var(--violet-border)] flex items-center justify-center shrink-0 select-none mt-0.5 shadow-md">
                                                <GraduationCap size={20} className="text-[var(--violet)]" />
                                            </div>
                                        )}
                                        <div className={`leading-relaxed max-w-[90%] md:max-w-[75%] ${
                                            msg.role === 'user' 
                                            ? 'px-5 py-3.5 rounded-[24px] rounded-br-[8px] bg-zinc-900/50 border border-white/5 text-white text-[14px] font-medium shadow-md' 
                                            : 'text-white text-[15px] pt-1 flex-1 font-serif leading-relaxed'
                                        }`}>
                                            {msg.role === 'user' ? (
                                                msg.content
                                            ) : (
                                                <Markdown 
                                                    isStreaming={isTyping && i === messages.length - 1} 
                                                    className="w-full"
                                                >
                                                    {typeof msg.content === 'string' ? msg.content : ""}
                                                </Markdown>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && messages[messages.length-1]?.role === 'user' && (
                                    <div className="flex gap-4 justify-start">
                                        <div className="w-10 h-10 rounded-2xl bg-[var(--violet-dim)] border border-[var(--violet-border)] flex items-center justify-center shrink-0 shadow-md">
                                            <Loader2 className="w-5 h-5 animate-spin text-[var(--violet)]" />
                                        </div>
                                        <div className="px-5 py-3 rounded-[24px] rounded-bl-[8px] bg-zinc-900/50 border border-white/5 flex items-center shadow-md">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-[var(--foreground-muted)] animate-pulse">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Input Area (Glassmorphic Container) */}
                    <div className="w-full mx-auto px-4 md:px-0 pb-6 md:pb-10 pt-4 shrink-0 relative z-30">
                        <GlassmorphicCard intensity="light" radius="20px" className="p-2 sm:p-2.5">
                            <div className="flex items-end gap-2">
                                <button 
                                    onClick={openModal} 
                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 text-[var(--foreground-muted)] hover:text-white transition-all shadow-sm cursor-pointer shrink-0"
                                    title="Attach File"
                                >
                                    <Paperclip size={16} />
                                </button>
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                    placeholder="Ask anything..."
                                    rows={1}
                                    className="flex-1 bg-transparent border-none outline-none resize-none py-2.5 px-3 text-[14px] font-bold text-white placeholder:text-[var(--foreground-muted)]/30 max-h-32 custom-scrollbar"
                                    onInput={(e) => {
                                        const t = e.target as HTMLTextAreaElement;
                                        t.style.height = "auto";
                                        t.style.height = Math.min(t.scrollHeight, 128) + "px";
                                    }}
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--violet)] text-black disabled:opacity-20 transition-all active:scale-90 shadow-[0_4px_12px_rgba(150,115,245,0.3)] hover:shadow-[0_6px_16px_rgba(150,115,245,0.4)] cursor-pointer shrink-0"
                                >
                                    {isTyping ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Send size={16} className="text-black" />}
                                </button>
                            </div>
                        </GlassmorphicCard>
                    </div>
                </motion.div>
            </main>
            
            <KnowledgeIngestModal />
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-[100dvh] bg-[var(--background)] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[var(--violet)] animate-spin" /></div>}>
            <ChatTool />
        </Suspense>
    );
}
