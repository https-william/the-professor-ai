"use client";

/**
 * DataDustLoader — The Professor's Signature Generation Screen
 *
 * Design language: "Midnight Scholar"
 * - High-performance brand blue identity
 * - Technical aesthetic — data streams, ink, scholarly precision
 * - CSS-driven animation for reliability; Framer Motion for phrase swap
 * - Full-screen centered; passes through context-specific phrases
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DataDustLoaderProps {
    phrases?: string[];
    currentPhraseIndex?: number;
    /** Optional label shown above the phrase, e.g. "Building Practice Exam" */
    label?: string;
}

const DEFAULT_PHRASES = [
    "Consulting the archives...",
    "Distilling key concepts...",
    "Encoding academic payloads...",
    "Applying active recall matrices...",
];

// --- Minimal canvas: slow drifting ink motes (< 50 particles, very light) ---
function InkMoteCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const isLowPerf = typeof document !== "undefined" && document.documentElement.classList.contains("low-perf");
        if (isLowPerf) {
            canvas.style.display = "none";
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let raf: number;
        let W = (canvas.width  = canvas.offsetWidth);
        let H = (canvas.height = canvas.offsetHeight);

        const onResize = () => {
            W = canvas.width  = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        };
        window.addEventListener("resize", onResize);

        // Monochrome ink shades palette
        const COLORS = ["rgba(255,255,255,", "rgba(200,200,200,", "rgba(150,150,150,", "rgba(100,100,100,"];

        const motes = Array.from({ length: 48 }, () => ({
            x:   Math.random() * W,
            y:   Math.random() * H,
            r:   Math.random() * 1.8 + 0.4,
            vx:  (Math.random() - 0.5) * 0.4,
            vy:  (Math.random() - 0.5) * 0.4,
            a:   Math.random() * 0.45 + 0.1,
            col: COLORS[Math.floor(Math.random() * COLORS.length)],
        }));

        const render = () => {
            ctx.clearRect(0, 0, W, H);

            // Draw gossamer connections
            for (let i = 0; i < motes.length; i++) {
                for (let j = i + 1; j < motes.length; j++) {
                    const dx = motes[i].x - motes[j].x;
                    const dy = motes[i].y - motes[j].y;
                    const d  = Math.sqrt(dx * dx + dy * dy);
                    if (d < 70) {
                        ctx.beginPath();
                        ctx.moveTo(motes[i].x, motes[i].y);
                        ctx.lineTo(motes[j].x, motes[j].y);
                        ctx.strokeStyle = `rgba(255,255,255,${0.08 * (1 - d / 70)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // Draw motes
            for (const m of motes) {
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
                ctx.fillStyle = `${m.col}${m.a})`;
                ctx.fill();

                m.x += m.vx;
                m.y += m.vy;
                if (m.x < 0 || m.x > W) m.vx *= -1;
                if (m.y < 0 || m.y > H) m.vy *= -1;
            }

            raf = requestAnimationFrame(render);
        };

        render();
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.6, mixBlendMode: "screen" }}
        />
    );
}

// --- Orbiting ring SVG (pure CSS animation, no JS) ---
function OrbitRing() {
    return (
        <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer slow ring */}
            <svg
                className="absolute inset-0 w-full h-full"
                style={{ animation: "professor-spin 6s linear infinite" }}
                viewBox="0 0 96 96"
            >
                <circle
                    cx="48" cy="48" r="44"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                    strokeDasharray="12 6"
                />
                {/* White traveller node */}
                <circle
                    cx="48" cy="4" r="3.5"
                    fill="white"
                    style={{ filter: "drop-shadow(0 0 6px white)" }}
                />
            </svg>

            {/* Inner counter-spin */}
            <svg
                className="absolute w-14 h-14"
                style={{ animation: "professor-spin 3.5s linear infinite reverse" }}
                viewBox="0 0 56 56"
            >
                <circle
                    cx="28" cy="28" r="24"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    strokeDasharray="4 10"
                />
                <circle
                    cx="28" cy="4" r="2.5"
                    fill="white"
                    style={{ filter: "drop-shadow(0 0 5px white)" }}
                />
            </svg>

            {/* Core glyph — scholarly pen-nib mark */}
            <div
                className="relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 0 24px rgba(255,255,255,0.2), inset 0 1px 1px rgba(255,255,255,0.06)",
                    animation: "professor-pulse 2.4s ease-in-out infinite",
                }}
            >
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 36 L8 14 L12 10 L20 24 L28 10 L32 14 Z" fill="white" />
                    <path d="M20 24 V36" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
}

// --- Step dots that fill in as time passes ---
const STEPS = ["Reading", "Thinking", "Writing", "Finishing"];

export default function DataDustLoader({
    phrases = DEFAULT_PHRASES,
    currentPhraseIndex = 0,
    label,
}: DataDustLoaderProps) {
    const [stepIdx, setStepIdx] = useState(0);

    // Advance step dot every ~3 s
    useEffect(() => {
        const id = setInterval(() => {
            setStepIdx(p => Math.min(p + 1, STEPS.length - 1));
        }, 3000);
        return () => clearInterval(id);
    }, []);

    const phrase = phrases[currentPhraseIndex % phrases.length];

    return (
        <>
            {/* Keyframes injected once via a style tag */}
            <style>{`
                @keyframes professor-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes professor-pulse {
                    0%, 100% { box-shadow: 0 0 24px rgba(255,255,255,0.2), inset 0 1px 1px rgba(255,255,255,0.06); }
                    50%       { box-shadow: 0 0 40px rgba(255,255,255,0.2), inset 0 1px 1px rgba(255,255,255,0.06); }
                }
                @keyframes professor-shimmer {
                    from { transform: translateX(-100%); }
                    to   { transform: translateX(200%); }
                }
            `}</style>

            <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
                style={{ background: "#060608" }}>

                {/* Canvas backdrop */}
                <div className="absolute inset-0">
                    <InkMoteCanvas />
                </div>

                {/* Radial white glow behind the ring */}
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: "320px", height: "320px",
                        background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
                    }}
                />

                {/* Main card */}
                <div
                    className="relative z-10 flex flex-col items-center gap-10 px-8 py-10 mx-4"
                    style={{ maxWidth: "420px", width: "100%" }}
                >
                    {/* Orbital graphic */}
                    <OrbitRing />

                    {/* Text block */}
                    <div className="w-full text-center space-y-3">
                        {label && (
                            <p
                                className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60 opacity-70"
                            >
                                {label}
                            </p>
                        )}

                        {/* Rotating phrase */}
                        <div className="h-7 flex items-center justify-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={phrase}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{   opacity: 0, y: -8 }}
                                    transition={{ type: "tween", duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                                    className="text-[15px] font-bold text-[var(--text)] tracking-tight"
                                    style={{ fontFamily: "var(--font-sans)" }}
                                >
                                    {phrase}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* Animated progress bar */}
                        <div
                            className="relative h-[2px] w-48 mx-auto rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                            <div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                    width: "40%",
                                    background: "white",
                                    animation: "professor-shimmer 1.8s ease-in-out infinite",
                                }}
                            />
                        </div>
                    </div>

                    {/* Step progress dots */}
                    <div className="flex items-center gap-6">
                        {STEPS.map((step, i) => {
                            const done   = i <  stepIdx;
                            const active = i === stepIdx;
                            return (
                                <div key={step} className="flex flex-col items-center gap-1.5">
                                    <motion.div
                                        animate={active ? { scale: [1, 1.3, 1] } : {}}
                                        transition={{ repeat: Infinity, duration: 1.2 }}
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            background: done || active
                                                ? "white"
                                                : "rgba(255,255,255,0.2)",
                                            opacity: done ? 1 : active ? 1 : 0.3,
                                            boxShadow: active ? "0 0 8px rgba(255,255,255,0.4)" : "none",
                                        }}
                                    />
                                    <span
                                        className="text-[9px] font-bold uppercase tracking-wider"
                                        style={{
                                            color: active ? "white" : "rgba(255,255,255,0.4)",
                                            opacity: done || active ? 1 : 0.35,
                                        }}
                                    >
                                        {step}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
