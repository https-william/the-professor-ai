"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface DataDustLoaderProps {
  phrases?: string[];
  currentPhraseIndex?: number;
}

const DEFAULT_PHRASES = [
  "Ingesting complex data payloads...",
  "Applying active recall matrices...",
  "Spinning up the Professor...",
  "Encoding memories...",
];

export default function DataDustLoader({ 
    phrases = DEFAULT_PHRASES, 
    currentPhraseIndex = 0 
}: DataDustLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    let width = canvas.width = canvas.parentElement?.clientWidth || 300;
    let height = canvas.height = 300; // Fixed inner height

    // Handle resize
    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || 300;
      height = canvas.height = 300;
    };
    window.addEventListener("resize", handleResize);

    // Particle system
    const particles: any[] = [];
    const particleCount = 80;
    
    // Amber and Emerald palette
    const colors = ["#F59E0B", "#10B981", "#D97706", "#047857"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 60) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.15 * (1 - distance / 60)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      // Draw central orbital ring
      const centerX = width / 2;
      const centerY = height / 2;
      const time = Date.now() * 0.001;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Orbiting node
      const orbX = centerX + Math.cos(time * 2) * 40;
      const orbY = centerY + Math.sin(time * 2) * 40;
      
      ctx.beginPath();
      ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#10B981";
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const currentPhrase = phrases[currentPhraseIndex % phrases.length];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Canvas Container */}
      <div className="relative w-full h-[300px] mb-8 flex items-center justify-center">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#06060B] to-transparent z-10 pointer-events-none" />
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-80"
          style={{ mixBlendMode: "screen" }}
        />
        
        {/* Core Jewel */}
        <motion.div 
            className="absolute z-20 w-16 h-16 rounded-full flex items-center justify-center border border-white/10 glass-card"
            animate={{ 
                boxShadow: ["0 0 20px rgba(245,158,11,0.2)", "0 0 50px rgba(16,185,129,0.4)", "0 0 20px rgba(245,158,11,0.2)"],
                scale: [1, 1.05, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
            <Sparkles size={24} strokeWidth={1.5} className="text-white/80 animate-pulse" />
        </motion.div>
      </div>

      {/* Dynamic Text Stream */}
      <div className="w-full bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
             <motion.div 
                className="h-full bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             />
        </div>
        
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F59E0B]/50 mb-2">Neural Link Active</p>
        <motion.div 
            key={currentPhraseIndex} // Forces re-animation on phrase change
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="font-mono text-sm text-white/80 tracking-tight"
        >
          {">"} {currentPhrase}
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
          >_</motion.span>
        </motion.div>
      </div>
    </div>
  );
}
