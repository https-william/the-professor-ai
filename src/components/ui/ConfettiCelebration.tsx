"use client";

import React, { useEffect, useRef, useCallback } from "react";

export interface ConfettiCelebrationProps {
  /** Whether the confetti is active */
  isActive: boolean;
  /** Number of particles */
  particleCount?: number;
  /** Duration in ms before auto-stop */
  duration?: number;
  /** Color palette for particles */
  colors?: string[];
  /** Callback when animation completes */
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'circle' | 'rect' | 'star';
}

const DEFAULT_COLORS = ['#E5A93C', '#F2BE65', '#2BB288', '#81E0C1', '#9673F5', '#CDBDFD', '#4A7CF5'];

/** Full-screen particle physics celebration overlay */
export default function ConfettiCelebration({
  isActive,
  particleCount = 80,
  duration = 3000,
  colors = DEFAULT_COLORS,
  onComplete,
}: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const createParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: (['circle', 'rect', 'star'] as const)[Math.floor(Math.random() * 3)],
      });
    }
    return particles;
  }, [particleCount, colors]);

  useEffect(() => {
    if (!isActive) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTimeout(() => onComplete?.(), 500);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesRef.current = createParticles();

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const fadeProgress = Math.max(0, (elapsed - duration * 0.6) / (duration * 0.4));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - fadeProgress);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          // Star shape
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = j % 2 === 0 ? p.size / 2 : p.size / 4;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      if (elapsed < duration) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, duration, createParticles, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[250] pointer-events-none"
      aria-hidden="true"
    />
  );
}
