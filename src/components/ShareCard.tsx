"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SHARE_CARD_TEMPLATES } from "@/lib/share-card-templates";

interface ShareCardProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title: string;
        count: number | string;
        type: string;
        user: string;
        date?: string;
    };
}

export default function ShareCard({ isOpen, onClose, data }: ShareCardProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState(SHARE_CARD_TEMPLATES[0].id);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const svgContainerRef = useRef<HTMLDivElement>(null);

    const activeTemplate = SHARE_CARD_TEMPLATES.find(t => t.id === selectedTemplateId) || SHARE_CARD_TEMPLATES[0];

    const today = data.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Replace placeholders in SVG
    const getProcessedSvg = () => {
        let svg = activeTemplate.svg;
        svg = svg.replace(/{{title}}/g, data.title);
        svg = svg.replace(/{{count}}/g, String(data.count));
        svg = svg.replace(/{{type}}/g, data.type.toUpperCase());
        svg = svg.replace(/{{user}}/g, data.user);
        svg = svg.replace(/{{date}}/g, today);
        return svg;
    };

    const handleDownload = async () => {
        if (!canvasRef.current) return;
        setIsGenerating(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const svgData = getProcessedSvg();
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = 1080;
            canvas.height = 1350;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `TheProfessor-${data.type}-${data.title.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            URL.revokeObjectURL(url);
            setIsGenerating(false);
        };

        img.src = url;
    };

    const handleShare = async () => {
        if (!canvasRef.current || typeof navigator === 'undefined' || !navigator.share) {
            handleDownload();
            return;
        }

        setIsGenerating(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const svgData = getProcessedSvg();
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = async () => {
            canvas.width = 1080;
            canvas.height = 1350;
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], "share-card.png", { type: "image/png" });
                try {
                    await navigator.share({
                        files: [file],
                        title: `My Study Stats - ${data.title}`,
                        text: `Check out my study session on The Professor! I just generated ${data.count} ${data.type}.`,
                    });
                } catch (err) {
                    console.error("Share failed:", err);
                    handleDownload();
                }
                URL.revokeObjectURL(url);
                setIsGenerating(false);
            }, "image/png");
        };

        img.src = url;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[var(--card)] border border-[var(--border)] rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden max-h-full"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-all"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Left: Preview */}
                <div className="flex-1 bg-black/5 p-6 flex items-center justify-center">
                    <div className="w-full max-w-[400px] aspect-[1080/1350] shadow-2xl rounded-lg overflow-hidden relative group">
                        <div
                            dangerouslySetInnerHTML={{ __html: getProcessedSvg() }}
                            className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none" />
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="w-full md:w-80 p-6 flex flex-col border-l border-[var(--border)] bg-[var(--card)]">
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Share Card</h3>
                    <p className="text-xs text-[var(--foreground-muted)] mb-6">Choose a template and share your progress</p>

                    <div className="flex-1 space-y-4 mb-6">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Templates</label>
                        <div className="grid grid-cols-2 gap-2">
                            {SHARE_CARD_TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplateId(t.id)}
                                    className={`p-2 rounded-xl border-2 transition-all ${selectedTemplateId === t.id
                                        ? "border-[var(--accent)] bg-[var(--accent)]/5"
                                        : "border-[var(--border)] bg-[var(--background-tertiary)] opacity-60 grayscale hover:grayscale-0"
                                        }`}
                                >
                                    <div className="aspect-square bg-[var(--border)] rounded-lg mb-2 overflow-hidden flex items-center justify-center p-2">
                                        <span className="material-symbols-outlined text-[var(--accent)]">image</span>
                                    </div>
                                    <span className="text-[10px] font-bold block text-center truncate">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 mt-auto">
                        <button
                            onClick={handleShare}
                            disabled={isGenerating}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] text-white font-bold text-sm shadow-xl shadow-[var(--accent)]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">ios_share</span>
                                    {typeof navigator !== "undefined" && typeof navigator.share === "function" ? "Share Image" : "Download PNG"}
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--foreground-muted)] font-medium text-xs hover:bg-[var(--background-tertiary)] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">download</span>
                            Download PNG
                        </button>
                    </div>

                    <p className="text-[9px] text-center text-[var(--foreground-muted)] mt-4">
                        Templates are generated client-side. No API cost.
                    </p>
                </div>

                {/* Hidden Canvas for Rendering */}
                <canvas ref={canvasRef} className="hidden" width="1080" height="1350" />
            </motion.div>
        </div>
    );
}
