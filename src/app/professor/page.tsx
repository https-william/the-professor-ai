"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/ui/Sidebar";
import { Send, Paperclip, FileText, Loader2, CheckCircle, XCircle, Bot, User } from "lucide-react";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
}

export default function ProfessorChatPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('initial');

    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
    const [currentFileName, setCurrentFileName] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm The Professor, your AI study assistant. What would you like to learn about today?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (initialQuery) {
            handleSend(initialQuery);
        }
    }, []);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        let successCount = 0;
        let failCount = 0;

        setCurrentFileName(fileArray.length === 1 ? fileArray[0].name : `${fileArray.length} files`);
        setUploadStatus('uploading');

        const uploadFile = async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await fetch("/api/library/ingest", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) throw new Error("Upload failed");
                successCount++;
            } catch {
                failCount++;
            }
        };

        try {
            setTimeout(() => { if (uploadStatus !== 'idle') setUploadStatus('parsing'); }, 800);
            await Promise.all(fileArray.map(uploadFile));

            if (failCount > 0 && successCount === 0) {
                setUploadStatus('error');
            } else {
                setUploadStatus('success');
                setCurrentFileName(failCount > 0 ? `${successCount} uploaded, ${failCount} failed` : "Upload complete");
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch {
            setUploadStatus('error');
        } finally {
            setUploadStatus('idle');
            setCurrentFileName("");
        }
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isSubmittingRef.current) return;

        isSubmittingRef.current = true;
        setIsLoading(true);

        const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
            });

            if (!response.ok) throw new Error("Connection failed");
            if (!response.body) return;

            let currentResponse = "";
            let isFirstChunk = true;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                currentResponse += chunk;

                if (isFirstChunk) {
                    setMessages(prev => [...prev, { role: 'assistant', content: currentResponse, timestamp: new Date() }]);
                    isFirstChunk = false;
                } else {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1] = { role: 'assistant', content: currentResponse, timestamp: new Date() };
                        return newMsgs;
                    });
                }
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || "Connection failed"}`, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
        }
    };

    return (
        <div className="min-h-screen bg-[#09090B]">
            <Sidebar />

            <main className="lg:ml-[260px] min-h-screen flex flex-col">
                {/* Header */}
                <header className="h-16 px-6 flex items-center justify-between border-b border-[#1F1F23] bg-[#09090B]/80 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="text-[14px] font-semibold text-white">The Professor</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-[#6366F1] animate-pulse' : 'bg-[#22C55E]'}`} />
                                <span className="text-[11px] text-[#71717A]">{isLoading ? 'Thinking...' : 'Online'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                            ? 'bg-[#16161A]'
                                            : 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <User className="w-4 h-4 text-[#A1A1AA]" />
                                        ) : (
                                            <Bot className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                        <div className={`inline-block max-w-[85%] rounded-2xl px-5 py-3.5 ${msg.role === 'user'
                                                ? 'bg-[#6366F1] text-white rounded-tr-md'
                                                : 'bg-[#0F0F11] border border-[#1F1F23] text-[#E4E4E7] rounded-tl-md'
                                            }`}>
                                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        <div className={`mt-1.5 text-[10px] text-[#52525B] ${msg.role === 'user' ? 'text-right pr-1' : 'pl-1'}`}>
                                            {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-[#0F0F11] border border-[#1F1F23] rounded-2xl rounded-tl-md px-5 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <motion.span
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                                            className="w-2 h-2 bg-[#6366F1] rounded-full"
                                        />
                                        <motion.span
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                                            className="w-2 h-2 bg-[#6366F1] rounded-full"
                                        />
                                        <motion.span
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                                            className="w-2 h-2 bg-[#6366F1] rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Upload Status */}
                <AnimatePresence>
                    {uploadStatus !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="px-6 pb-3"
                        >
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-[#0F0F11] border border-[#1F1F23] rounded-xl px-4 py-3 flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${uploadStatus === 'error' ? 'bg-red-500/10' : 'bg-[#6366F1]/10'}`}>
                                        {uploadStatus === 'error' ? (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        ) : uploadStatus === 'success' ? (
                                            <CheckCircle className="w-5 h-5 text-[#22C55E]" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-[#6366F1]" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[13px] font-medium text-white">{currentFileName}</div>
                                        <div className="text-[12px] text-[#71717A] flex items-center gap-2">
                                            {(uploadStatus === 'uploading' || uploadStatus === 'parsing') && (
                                                <Loader2 className="w-3 h-3 animate-spin text-[#6366F1]" />
                                            )}
                                            <span className="capitalize">{uploadStatus}...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input */}
                <div className="px-6 py-5 border-t border-[#1F1F23] bg-[#09090B]">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.txt,.md,.pptx,.docx,.csv"
                                className="hidden"
                                id="file-upload"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                disabled={isLoading || uploadStatus !== 'idle'}
                            />
                            <motion.label
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                htmlFor="file-upload"
                                className={`flex items-center justify-center w-11 h-11 rounded-lg bg-[#0F0F11] border border-[#1F1F23] hover:border-[#2A2A2F] cursor-pointer transition-colors ${isLoading || uploadStatus !== 'idle' ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <Paperclip className="w-[18px] h-[18px] text-[#71717A]" />
                            </motion.label>
                        </div>

                        <div className="flex-1 flex items-center bg-[#0F0F11] border border-[#1F1F23] rounded-lg focus-within:border-[#6366F1]/50 focus-within:ring-1 focus-within:ring-[#6366F1]/20 transition-all">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything about your studies..."
                                className="border-none bg-transparent focus-visible:ring-0 h-11 text-[14px] text-white placeholder:text-[#52525B]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                disabled={isLoading || uploadStatus !== 'idle'}
                            />
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={() => handleSend()}
                                disabled={isLoading || uploadStatus !== 'idle' || !input.trim()}
                                className="h-11 w-11 bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-[#6366F1]/20"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                                ) : (
                                    <Send className="w-[18px] h-[18px]" />
                                )}
                            </Button>
                        </motion.div>
                    </div>
                    <div className="max-w-3xl mx-auto mt-2 text-center">
                        <span className="text-[11px] text-[#52525B]">Press Enter to send • Attach PDFs, docs, or notes for context</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
