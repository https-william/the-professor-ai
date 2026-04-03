"use client";

import { useState, useRef } from "react";
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
        items?: any[]; // To allow full document export
        date?: string;
    };
}

export default function ShareCard({ isOpen, onClose, data }: ShareCardProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState(SHARE_CARD_TEMPLATES[0].id);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const activeTemplate = SHARE_CARD_TEMPLATES.find(t => t.id === selectedTemplateId) || SHARE_CARD_TEMPLATES[0];

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

    // Replace placeholders in SVG
    const getProcessedSvg = () => {
        let svg = activeTemplate.svg;
        svg = svg.replace("<svg ", "<svg style=\"width: 100%; height: 100%;\" ");
        svg = svg.replace(/<text([^>]*)>{{title}}<\/text>/g, (match, attrs) => {
            const lines = wrapTextToTspans(data.title, 20);
            const xMatch = attrs.match(/x="([^"]+)"/);
            const xVal = xMatch ? xMatch[1] : "540";
            const dyFirst = lines.length > 2 ? "-0.5em" : "0";
            const tspanStr = lines.map((line, i) => 
                `<tspan x="${xVal}" dy="${i === 0 ? dyFirst : '1.2em'}">${line}</tspan>`
            ).join("");
            return `<text${attrs}>${tspanStr}</text>`;
        });
        svg = svg.replace(/{{count}}/g, String(data.count));
        svg = svg.replace(/{{type}}/g, data.type.toUpperCase());
        svg = svg.replace(/{{user}}/g, data.user);
        svg = svg.replace(/{{date}}/g, today);
        return svg;
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

    const handleNativeShare = async () => {
        if (!canvasRef.current || typeof navigator === 'undefined' || !navigator.share) {
            handleDownloadImage();
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
                        title: `My Study Progress - ${data.title}`,
                        text: `Check out what I just generated with The Professor: ${data.count} ${data.type}!`,
                    });
                } catch (err) {
                    console.error("Share failed:", err);
                    handleDownloadImage();
                }
                URL.revokeObjectURL(url);
                setIsGenerating(false);
            }, "image/png");
        };
        img.src = url;
    };

    const handleExportPDF = () => {
        // Create a hidden print structure
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const isQuiz = data.type.toLowerCase() === 'quiz';
        const items = data.items || [];

        let contentHtml = `
            <html>
            <head>
                <title>${data.title}</title>
                <style>
                    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
                    .header { border-bottom: 2px solid #F59E0B; padding-bottom: 20px; margin-bottom: 40px; }
                    .title { font-size: 28px; font-weight: 800; margin: 0; color: #000; }
                    .meta { font-size: 12px; color: #666; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
                    .item { margin-bottom: 30px; page-break-inside: avoid; }
                    .question { font-weight: 700; font-size: 16px; margin-bottom: 12px; display: flex; gap: 10px; }
                    .options { list-style: none; padding: 0; margin: 0 0 0 25px; }
                    .option { margin-bottom: 6px; padding: 8px 12px; border: 1px solid #eee; border-radius: 8px; font-size: 14px; }
                    .flashcard { border: 1px solid #eee; padding: 20px; border-radius: 12px; background: #fafafa; }
                    .front { font-weight: 700; font-size: 16px; margin-bottom: 10px; color: #F59E0B; }
                    .back { font-size: 14px; color: #444; border-top: 1px solid #eee; padding-top: 10px; }
                    .answer-key { margin-top: 60px; border-top: 2px dashed #ccc; padding-top: 40px; page-break-before: always; }
                    .ak-title { font-size: 20px; font-weight: 800; margin-bottom: 20px; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">${data.title}</h1>
                    <div class="meta">${data.type} • ${data.count} Items • Generated by ${data.user} on ${today}</div>
                </div>
                <div class="content">
                    ${items.map((item, idx) => {
                        if (isQuiz) {
                            return `
                                <div class="item">
                                    <div class="question"><span>${idx + 1}.</span> <span>${item.question}</span></div>
                                    <div class="options">
                                        ${item.options.map((opt: string, i: number) => `
                                            <div class="option">${String.fromCharCode(65 + i)}) ${opt}</div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="item flashcard">
                                    <div class="front">${item.front}</div>
                                    <div class="back">${item.back}</div>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
                ${isQuiz ? `
                    <div class="answer-key">
                        <h2 class="ak-title">Answer Key</h2>
                        <div style="display: grid; grid-template-cols: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;">
                            ${items.map((item, idx) => `
                                <div style="font-size: 14px;"><strong>${idx + 1}:</strong> ${String.fromCharCode(65 + item.correctIndex)}</div>
                            `).join('')}
                        </div>
                        <div style="margin-top: 40px; font-size: 12px; color: #999;">
                            ${items.map((item, idx) => `
                                <p><strong>${idx + 1} Explanation:</strong> ${item.explanation}</p>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <script>
                    window.onload = () => {
                        window.print();
                        // Optional: window.close();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(contentHtml);
        printWindow.document.close();
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
                    <span className="material-symbols-outlined text-lg">close</span>
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

                    <div className="flex-1 space-y-4 mb-6">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/20">Aesthetic Templates</label>
                        <div className="grid grid-cols-2 gap-2">
                            {SHARE_CARD_TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplateId(t.id)}
                                    className={`p-2 rounded-xl border-2 transition-all ${selectedTemplateId === t.id
                                        ? "border-[#F59E0B] bg-[#F59E0B]/5"
                                        : "border-white/5 bg-white/[0.02] opacity-60 grayscale hover:grayscale-0"
                                        }`}
                                >
                                    <div className="aspect-square bg-white/5 rounded-lg mb-2 overflow-hidden flex items-center justify-center p-2 text-[#F59E0B]">
                                        <span className="material-symbols-outlined text-[24px]">palette</span>
                                    </div>
                                    <span className="text-[10px] font-bold block text-center truncate text-white/40">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 mt-auto">
                        <button
                            onClick={handleNativeShare}
                            disabled={isGenerating}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#08080E] font-black text-[13px] shadow-xl shadow-[#F59E0B]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">ios_share</span>
                                    Share Achievement
                                </>
                            )}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleDownloadImage}
                                disabled={isGenerating}
                                className="py-2.5 rounded-xl border border-white/5 text-white/40 font-bold text-[11px] hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[16px]">image</span>
                                PNG
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="py-2.5 rounded-xl border border-white/5 text-white/40 font-bold text-[11px] hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                PDF
                            </button>
                        </div>
                    </div>

                    <p className="text-[9px] text-center text-white/20 mt-4 font-medium italic">
                        The Professor generates high-fidelity exports locally.
                    </p>
                </div>

                <canvas ref={canvasRef} className="hidden" width="1080" height="1350" />
            </motion.div>
        </div>
    );
}

function Loader2Icon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
