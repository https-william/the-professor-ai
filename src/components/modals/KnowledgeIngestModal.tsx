"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIngestStore } from "@/store/useIngestStore";
import { X, Upload, CheckCircle2, Loader2, AlertCircle, Sparkles, MessageCircle } from "lucide-react";

/* ═══ Claymorphic style helpers ═══ */
const clay = {
    modal: {
        background: "rgba(10, 10, 20, 0.85)",
        backdropFilter: "blur(20px)",
        borderRadius: "32px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05), inset 0 -1px 2px rgba(0, 0, 0, 0.3), 0 24px 64px rgba(0, 0, 0, 0.5)",
    } as React.CSSProperties,
    dropzone: {
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "24px",
        border: "2px dashed rgba(245, 158, 11, 0.2)",
        transition: "all 0.3s ease",
    } as React.CSSProperties,
};

interface KnowledgeIngestModalProps {
    onSuccess?: (text: string) => void; 
}

export default function KnowledgeIngestModal({ onSuccess }: KnowledgeIngestModalProps) {
    const { isModalOpen, closeModal, queue, addFiles, updateFileStatus } = useIngestStore();
    const [dragActive, setDragActive] = useState(false);

    const uploadWithXHR = (url: string, formData: FormData, id: string, phaseWeight: number, baseProgress: number): Promise<any> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * phaseWeight);
                    updateFileStatus(id, url.includes('parse') ? 'reading' : 'learning', baseProgress + percent);
                }
            };
            xhr.onload = () => {
                let responseData;
                try {
                    responseData = JSON.parse(xhr.responseText);
                } catch {
                    return reject(new Error("Invalid server response"));
                }
                if (xhr.status >= 200 && xhr.status < 300) resolve(responseData);
                else reject(new Error(responseData?.error || "Upload failed"));
            };
            xhr.onerror = () => reject(new Error("Network error during upload"));
            xhr.send(formData);
        });
    };

    // ─── SEQUENTIAL PROCESSOR ───────────────────────────────────
    const processQueue = useCallback(async (filesWithIds: {file: File, id: string}[]) => {
        for (const {file, id} of filesWithIds) {
            try {
                // 1. Reading Phase (Parsing) - sweeps 0 to 50%
                updateFileStatus(id, 'reading', 0);
                const parseForm = new FormData();
                parseForm.append('file', file);
                
                const parseData = await uploadWithXHR('/api/parse', parseForm, id, 50, 0);
                
                // Send text to caller (e.g. Creator Studio)
                if (onSuccess) onSuccess(parseData.text);

                // 2. Learning Phase (Vectorizing) - sweeps 50 to 100%
                updateFileStatus(id, 'learning', 50);
                const ingestForm = new FormData();
                ingestForm.append('file', file);
                
                const ingestData = await uploadWithXHR('/api/library/ingest', ingestForm, id, 50, 50);

                updateFileStatus(id, 'success', 100);
            } catch (err: any) {
                updateFileStatus(id, 'error', 0, err.message);
            }
        }
    }, [updateFileStatus, onSuccess]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const filesWithIds = files.map(f => ({ file: f, id: Math.random().toString(36).substring(7) }));
            addFiles(files, filesWithIds.map(f => f.id));
            processQueue(filesWithIds);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const filesWithIds = files.map(f => ({ file: f, id: Math.random().toString(36).substring(7) }));
            addFiles(files, filesWithIds.map(f => f.id));
            processQueue(filesWithIds);
        }
    };

    if (!isModalOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeModal}
                    className="absolute inset-0 bg-[#06060B]/80 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg overflow-hidden"
                    style={clay.modal}
                >
                    {/* Header */}
                    <div className="p-6 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/20">
                                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white/95">Share Notes</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Upload study materials for your Professor</p>
                            </div>
                        </div>
                        <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        
                        {/* Dropzone */}
                        <label 
                            onDragEnter={() => setDragActive(true)}
                            onDragLeave={() => setDragActive(false)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDrop}
                            className="block cursor-pointer group"
                        >
                            <div 
                                style={{
                                    ...clay.dropzone,
                                    borderColor: dragActive ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                                    background: dragActive ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)',
                                }}
                                className="p-10 flex flex-col items-center justify-center text-center transition-all"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className={`w-8 h-8 ${dragActive ? 'text-[#F59E0B]' : 'text-white/20'}`} />
                                </div>
                                <h4 className="text-[15px] font-bold text-white/70 mb-1">Drop notes here</h4>
                                <p className="text-[11px] text-white/20 uppercase tracking-widest font-black">PDF, Word, or Markdown</p>
                                <input type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,.md" />
                            </div>
                        </label>

                        {/* File Queue */}
                        {queue.length > 0 && (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/20">Professor's Thoughts</span>
                                </div>
                                
                                {queue.map((item) => (
                                    <div key={item.id} className="p-4 rounded-2xl bg-[#0D0D14]/80 border border-white/5 space-y-3 flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center shrink-0 border border-[#F59E0B]/20">
                                            <MessageCircle className="w-4 h-4 text-[#F59E0B]" />
                                        </div>
                                        <div className="flex-1 mt-1">
                                            {item.status === 'success' ? (
                                                <p className="text-[13px] font-medium text-white/90 leading-relaxed">
                                                    "Alright! I have completely understood <span className="text-[#F59E0B] font-bold">{item.name}</span>! What would you like to build from it?"
                                                </p>
                                            ) : item.status === 'error' ? (
                                                <p className="text-[13px] font-medium text-red-400/90 leading-relaxed">
                                                    "I ran into an issue reading <span className="font-bold">{item.name}</span>: {item.errorMessage}"
                                                </p>
                                            ) : (
                                                <div className="flex flex-col gap-2 w-full pr-4">
                                                    <p className="text-[13px] font-medium text-white/70 leading-relaxed italic flex items-center gap-2">
                                                        "{item.status === 'reading' ? 'Uploading & reading' : 'Learning'} <span className="text-white/90 font-bold">{item.name}</span>..."
                                                        {item.progress !== 100 && <Loader2 className="w-3 h-3 text-[#F59E0B] animate-spin shrink-0" />}
                                                    </p>
                                                    
                                                    {/* Custom Live Progress Bar */}
                                                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-1 max-w-[200px]">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.progress}%` }}
                                                            className="h-full bg-[#F59E0B] rounded-full"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-[#F59E0B]/80">{item.progress}%</p>
                                                </div>
                                            )}
                                        </div>
                                        {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />}
                                        {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-1" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-white/[0.02] flex items-center justify-between">
                         <p className="text-[10px] text-white/20 italic">For your privacy, uploaded materials disappear after 7 days.</p>
                         <button 
                            onClick={closeModal}
                            className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white/40 hover:text-white/80 transition-colors bg-white/5 hover:bg-white/10"
                         >
                            Dismiss
                         </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
