"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlassmorphicCard from "./GlassmorphicCard";
import Markdown from "./Markdown";
import { useUser } from "@/context/UserContext";

export interface FloatingChatProps {
  className?: string;
  placeholder?: string;
}

export default function FloatingChat({
  className = "",
  placeholder = "Ask The Professor...",
}: FloatingChatProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate unique thread ID for this floating chat session on mount
    if (typeof window !== "undefined") {
      setThreadId(crypto.randomUUID());
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || !threadId) return;

    const userText = inputValue.trim();
    const userMsg = { role: "user", content: userText };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, threadId }),
      });

      if (!response.ok) throw new Error("Could not connect to AI assistant.");

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
      console.error("Floating Chat Error:", err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I encountered a minor thinking glitch. Let's try that query again." }
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex flex-col items-end ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-4 w-[340px] sm:w-[380px] h-[500px] flex flex-col"
          >
            <GlassmorphicCard
              intensity="heavy"
              radius="24px"
              className="w-full h-full flex flex-col overflow-hidden border border-white/10"
              style={{
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4), 0 0 20px rgba(229, 169, 60, 0.05)"
              }}
            >
              {/* Header */}
              <div className="p-4 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-[#E5A93C]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-[0.1em] text-white italic">
                      The Professor
                    </h4>
                    <p className="text-[10px] text-[#E5A93C] font-semibold">
                      Study Strategist AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Thread */}
              <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#E5A93C]/5 border border-[#E5A93C]/10 flex items-center justify-center">
                      <MessageSquare size={20} className="text-[#E5A93C]/60" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/80">
                        Ask me anything about your studies.
                      </p>
                      <p className="text-[10px] text-white/40 mt-1 max-w-[200px] mx-auto leading-relaxed">
                        I have full access to your uploaded study material to guide your revision.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2.5 max-w-[85%] ${
                        msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-lg bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles size={11} className="text-[#E5A93C]" />
                        </div>
                      )}
                      <div
                        className={`text-xs leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-[#E5A93C] text-black font-medium rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-white/80 rounded-tl-none'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <Markdown
                            isStreaming={isTyping && i === messages.length - 1}
                            className="w-full"
                          >
                            {msg.content}
                          </Markdown>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isTyping && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2.5 self-start">
                    <div className="w-6 h-6 rounded-lg bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center shrink-0">
                      <Loader2 size={11} className="text-[#E5A93C] animate-spin" />
                    </div>
                    <div className="px-3.5 py-2 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none flex items-center">
                      <span className="text-[9px] uppercase font-black tracking-widest text-[#E5A93C] animate-pulse">
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-zinc-950/80 border-t border-white/5 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={placeholder}
                  disabled={isTyping}
                  className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-[#E5A93C]/35 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="p-2 rounded-xl bg-[#E5A93C] text-black hover:bg-[#F2BE65] disabled:opacity-40 disabled:hover:bg-[#E5A93C] transition-all flex items-center justify-center shrink-0"
                >
                  <Send size={14} fill="currentColor" />
                </button>
              </div>
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-[#E5A93C] text-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative group"
        style={{
          boxShadow: "0 8px 24px rgba(229, 169, 60, 0.3), 0 2px 8px rgba(0, 0, 0, 0.4)"
        }}
        title="Ask The Professor"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare size={20} strokeWidth={2.2} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Orbit glow ring on hover */}
        <span className="absolute inset-0 rounded-full border border-[#E5A93C]/50 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
      </button>
    </div>
  );
}
