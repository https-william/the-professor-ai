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
import DopamineWaitingRoom from "@/components/ui/DopamineWaitingRoom";

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

export default function DataDustLoader({
    phrases = DEFAULT_PHRASES,
    currentPhraseIndex = 0,
    label,
}: DataDustLoaderProps) {
    const phrase = phrases[currentPhraseIndex % phrases.length];

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "#060608" }}>

            {/* Radial white glow */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: "480px", height: "480px",
                    background: "radial-gradient(circle, rgba(255,255,255,0.015) 0%, transparent 70%)",
                }}
            />

            {/* Main Dopamine Ramp Card */}
            <div
                className="relative z-10 flex flex-col items-center gap-4 px-4 py-8 mx-4"
                style={{ maxWidth: "520px", width: "100%" }}
            >
                <DopamineWaitingRoom title={label || phrase} />
            </div>
        </div>
    );
}
