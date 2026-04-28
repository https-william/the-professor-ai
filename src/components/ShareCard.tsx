"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    TEMPLATE_REGISTRY, 
    renderTemplate, 
    getTemplatesForType, 
    ContentType 
} from "@/lib/templates/share-card-templates";
import { 
    Loader2, 
    X, 
    Share, 
    Image as FileImage, 
    FileText, 
    Layout, 
    Focus, 
    Settings,
    FileType,
    Check
} from "lucide-react";
import { exportToPDF } from "@/lib/pdf-bridge";
import PrintLayout from "@/components/premium/PrintLayout";
import { Button } from "@/components/ui/button";

interface ShareCardProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title: string;
        count: number | string;
        type: string;
        user: string;
        items?: any[]; // To allow full document export
        date?: string;
    };
}

export default function ShareCard({ isOpen, onClose, data }: ShareCardProps) {
    const contentType = (data.type.toLowerCase() === 'quiz' ? 'quiz' : 
                         data.type.toLowerCase().includes('flash') ? 'flashcard' : 
                         data.type.toLowerCase().includes('summary') ? 'summary' : 
                         data.type.toLowerCase() === 'mastery' ? 'mastery' : 'chat') as ContentType;

    const filteredTemplates = useMemo(() => getTemplatesForType(contentType), [contentType]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(filteredTemplates[0]?.id || TEMPLATE_REGISTRY[0].id);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const activeTemplate = TEMPLATE_REGISTRY.find(t => t.id === selectedTemplateId) || TEMPLATE_REGISTRY[0];

    const today = data.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Smart text wrapping for SVG
    const wrapTextToTspans = (text: string, maxCharsPerLine = 22) => {
        const words = text.split(" ");
        let lines = [];
        let currentLine = "";

        for (const word of words) {
            if ((currentLine + word).length > maxCharsPerLine) {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = word + " ";
            } else {
                currentLine += word + " ";
            }
        }
        if (currentLine) lines.push(currentLine.trim());
        return lines;
    };

    // Use the new dynamic engine
    const getProcessedSvg = () => {
        return renderTemplate(selectedTemplateId, {
            type: contentType,
            title: data.title,
            data: { count: data.count },
            topics: [], // Topics are extracted in the engine if not provided
            author: data.user,
            createdAt: today
        });
    };

    const handleNativeShare = async () => {
        if (!canvasRef.current) return;
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], `TheProfessor-${data.type}.png`, { type: "image/png" });
                
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Achievement: ${data.title}`,
                            text: `I just mastered ${data.title} on The Professor! #ProfessorAI #ActiveRecall`,
                        });
                    } catch (err) {
                        console.error("Native share failed:", err);
                        handleDownloadImage(); // Fallback
                    }
                } else {
                    handleDownloadImage(); // Fallback
                }
                URL.revokeObjectURL(url);
                setIsGenerating(false);
            }, "image/png");
        };
        img.src = url;
    };

    const handleDownloadImage = async () => {
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

    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            await exportToPDF("pdf-export-container", {
                title: data.title,
                filename: `TheProfessor-${data.type}-${data.title.replace(/\s+/g, '-')}`,
                author: data.user
            });
        } catch (err) {
            console.error("PDF Export error:", err);
            // Optionally trigger a toast here
        } finally {
            setIsExportingPDF(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#12121A] border border-white/5 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden max-h-full"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                    <X size={18} strokeWidth={1.5} />
                </button>

                {/* Left: Preview */}
                <div className="flex-1 bg-black/20 p-6 flex items-center justify-center">
                    <div className="w-full max-w-[400px] aspect-[1080/1350] shadow-2xl rounded-lg overflow-hidden relative group">
                        <div
                            dangerouslySetInnerHTML={{ __html: getProcessedSvg() }}
                            className="w-full h-full"
                        />
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="w-full md:w-80 p-6 flex flex-col border-l border-white/5 bg-[#0D0D14]">
                    <h3 className="text-lg font-bold text-white/90 mb-1">Share Achievement</h3>
                    <p className="text-[11px] text-white/30 mb-6 uppercase tracking-widest font-black">Customize & Export</p>

                    <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/20">Aesthetic Templates ({filteredTemplates.length})</label>
                        <div className="grid grid-cols-2 gap-2">
                            {filteredTemplates.slice(0, 20).map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplateId(t.id)}
                                    className={`p-2 rounded-xl border-2 transition-all text-left group ${selectedTemplateId === t.id
                                        ? "border-[#F59E0B] bg-[#F59E0B]/5"
                                        : "border-white/5 bg-white/[0.02] hover:border-white/10"
                                        }`}
                                >
                                    <div 
                                        className="aspect-[1080/1350] w-full rounded-lg mb-2 overflow-hidden flex flex-col items-center justify-center relative border border-white/5"
                                        style={{ backgroundColor: `${t.previewColor}15` }}
                                    >
                                        {/* Abstract Layout Preview */}
                                        <div className="w-full h-full p-2 opacity-40">
                                            <div className="w-full h-full flex flex-col gap-1.5">
                                                {t.layoutId === 'centered' ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-4 h-1 bg-white/20 rounded-full"/>
                                                        <div className="w-8 h-8 rounded-full border border-white/10"/>
                                                        <div className="w-6 h-1.5 bg-white/10 rounded-full"/>
                                                    </div>
                                                ) : t.layoutId === 'magazine' ? (
                                                    <div className="flex gap-1 h-full">
                                                        <div className="w-1 h-full bg-white/20"/>
                                                        <div className="flex-1 flex flex-col gap-1">
                                                            <div className="w-full h-2 bg-white/10"/>
                                                            <div className="w-2/3 h-1 bg-white/5"/>
                                                            <div className="mt-auto w-4 h-4 bg-white/20"/>
                                                        </div>
                                                    </div>
                                                ) : t.layoutId === 'poster' ? (
                                                    <div className="flex flex-col gap-1 h-full">
                                                        <div className="w-full h-6 bg-white/10"/>
                                                        <div className="mt-auto w-full h-4 bg-white/20"/>
                                                    </div>
                                                ) : t.layoutId === 'split-vertical' ? (
                                                    <div className="flex gap-1 h-full">
                                                        <div className="flex-1 bg-white/5"/>
                                                        <div className="flex-1 bg-white/10"/>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-1 w-full h-full">
                                                        <div className="bg-white/5"/><div className="bg-white/10"/>
                                                        <div className="bg-white/10"/><div className="bg-white/5"/>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            {t.layoutId === 'magazine' ? <FileText size={14} strokeWidth={1.5} style={{ color: t.previewColor }} /> : 
                                             t.layoutId === 'poster' ? <Layout size={14} strokeWidth={1.5} style={{ color: t.previewColor }} /> : 
                                             t.layoutId === 'spotlight' ? <Focus size={14} strokeWidth={1.5} style={{ color: t.previewColor }} /> : 
                                             <Settings size={14} strokeWidth={1.5} style={{ color: t.previewColor }} />}
                                        </div>
                                        {selectedTemplateId === t.id && (
                                            <div className="absolute inset-0 bg-[#F59E0B]/10 animate-pulse" />
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-bold block truncate transition-colors ${selectedTemplateId === t.id ? 'text-[#F59E0B]' : 'text-white/30'}`}>
                                        {t.label.split(' (')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {filteredTemplates.length > 20 && (
                            <p className="text-[9px] text-white/10 text-center italic">Scroll for more styles...</p>
                        )}
                    </div>

                    <div className="space-y-4 mt-auto">
                        <Button
                            onClick={handleNativeShare}
                            variant="jelly"
                            className="w-full h-14 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] text-white shadow-[0_8px_20px_var(--accent-glow)]"
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Share className="w-5 h-5 mr-2" />
                                    Share Achievement
                                </>
                            )}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={handleDownloadImage}
                                variant="jelly-ghost"
                                className="h-11"
                                disabled={isGenerating}
                            >
                                <FileImage className="w-4 h-4 mr-2 opacity-50" />
                                PNG
                            </Button>
                            <Button
                                onClick={handleExportPDF}
                                variant="jelly-ghost"
                                className="h-11"
                                disabled={isExportingPDF}
                            >
                                {isExportingPDF ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <FileType className="w-4 h-4 mr-2 opacity-50" />
                                        High-Res PDF
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <PrintLayout data={data} />

                    <p className="text-[9px] text-center text-white/20 mt-4 font-medium italic">
                        The Professor generates high-fidelity exports locally.
                    </p>
                </div>

                <canvas ref={canvasRef} className="hidden" width="1080" height="1350" />
            </motion.div>
        </div>
    );
}
