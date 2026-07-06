"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, BrainCircuit, Share2, Sparkles, CheckCircle2 } from "lucide-react";
import StandardContainer from "@/components/ui/StandardContainer";
import { useToasts } from "@/components/ui/GlobalToasts";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

// Programmatic Web Audio Synthesizer
const playResultsSound = (type: "click" | "page-turn") => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        if (type === "click") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(580, now);
            gain.gain.setValueAtTime(0.012, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        }
    } catch (e) {}
};

const playEli5Swell = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // Warm double oscillator synthesizer pad swell
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(220, now); // A3 base tone
        osc1.frequency.exponentialRampToValueAtTime(329.63, now + 1.2); // swell to E4

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(440, now); // A4 harmonic
        osc2.frequency.exponentialRampToValueAtTime(659.25, now + 1.2); // swell to E5

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.015, now + 0.9);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 1.25);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(750, now);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.3);
        osc2.stop(now + 1.3);
    } catch (e) {}
};

export default function Eli5Viewer() {
    const router = useRouter();
    const { addToast } = useToasts();
    const [content, setContent] = useState<{ text: string, title: string } | null>(null);

    // 2.5D Tilt states
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [sweepX, setSweepX] = useState(50);
    const [sweepY, setSweepY] = useState(50);

    useEffect(() => {
        const stored = sessionStorage.getItem("lastEli5");
        if (!stored) {
            router.push("/dashboard");
            return;
        }
        setContent(JSON.parse(stored));
        playEli5Swell();
    }, [router]);

    const handleCopy = () => {
        if (!content) return;
        playResultsSound("click");
        navigator.clipboard.writeText(content.text);
        addToast("Analogy copied to clipboard", "success");
    };

    const handleReturn = () => {
        playResultsSound("click");
        router.push("/dashboard");
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        
        const tiltX = ((y - centerY) / centerY) * 8; // max 8 deg
        const tiltY = ((centerX - x) / centerX) * 8; // max 8 deg
        
        setRotateX(tiltX);
        setRotateY(tiltY);
        
        const pctX = (x / box.width) * 100;
        const pctY = (y / box.height) * 100;
        setSweepX(pctX);
        setSweepY(pctY);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setSweepX(50);
        setSweepY(50);
    };

    if (!content) return null;

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 py-24 relative overflow-hidden flex flex-col justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#9673F5]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <StandardContainer>
                <div className="max-w-2xl mx-auto space-y-12 relative z-10">
                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={handleReturn}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-white transition-all cursor-pointer"
                        >
                            <ChevronLeft size={16} /> Return to Studio
                        </button>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleCopy} 
                                className="p-3 rounded-full bg-white/5 border border-white/5 shadow-sm hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer text-zinc-400 hover:text-white"
                            >
                                <Share2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Analogy Card with 2.5D tilt */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="perspective-1000"
                    >
                        <div
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
                                transition: "transform 0.15s ease-out",
                                transformStyle: "preserve-3d"
                            }}
                            className="relative"
                        >
                            <GlassmorphicCard 
                                intensity="heavy" 
                                radius="40px" 
                                className="relative p-12 sm:p-16 overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                                style={{
                                    backgroundImage: `radial-gradient(circle at ${sweepX}% ${sweepY}%, rgba(150, 115, 245, 0.12) 0%, transparent 65%)`
                                }}
                            >
                                {/* Background Decorative Brain Icon */}
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-white">
                                    <BrainCircuit size={120} />
                                </div>
                                
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-[#9673F5]/10 flex items-center justify-center mb-10 border border-[#9673F5]/20 shadow-inner">
                                        <Sparkles className="text-[#9673F5]" size={28} />
                                    </div>
                                    
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#9673F5] mb-6">The Analogy</h2>
                                    
                                    {/* Quote Text Styled with Serif */}
                                    <p className="text-xl sm:text-2xl font-serif text-zinc-100 leading-relaxed tracking-wide mb-12 italic">
                                        &ldquo;{content.text}&rdquo;
                                    </p>
                                    
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-[1px] w-12 bg-white/10" />
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                            Simplified for Cognitive Ease
                                        </p>
                                    </div>
                                </div>
                            </GlassmorphicCard>
                        </div>
                    </motion.div>

                    {/* Footer Actions */}
                    <div className="flex flex-col items-center gap-6">
                        <button 
                            onClick={handleReturn}
                            className="group flex items-center gap-4 bg-white text-zinc-950 px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover-scale-lg active:scale-95 shadow-2xl cursor-pointer"
                        >
                            <span>Initialize New Journey</span>
                            <CheckCircle2 size={18} className="text-[#9673F5]" />
                        </button>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center">
                            Mastered by The Professor
                        </p>
                    </div>
                </div>
            </StandardContainer>
        </div>
    );
}
