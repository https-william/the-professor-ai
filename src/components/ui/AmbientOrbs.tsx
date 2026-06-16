"use client";

import React from "react";

/**
 * AmbientOrbs — Atmospheric depth layer.
 * 
 * Performance architecture:
 * - Uses CSS-only animations (no JS runtime cost)
 * - contain: strict isolates paint to this layer only
 * - will-change: transform promotes to GPU compositor layer
 * - Reduced blur radius for mobile (60px vs 140px)
 * - No useEffect / no mounted guard — renders immediately with CSS
 */
export default function AmbientOrbs() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-[0]"
      aria-hidden="true"
      style={{ contain: 'strict' }}
    >
      {/* Orb 1: Rich Blue */}
      <div 
        className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full mix-blend-normal animate-ambient-drift-1"
        style={{
          background: "radial-gradient(circle, var(--blue), transparent 70%)",
          filter: "blur(80px)",
          opacity: "calc(var(--orb-opacity) * 2.6)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
          contain: "strict",
        }}
      />
      {/* Orb 2: Warm Amber/Gold */}
      <div 
        className="absolute bottom-[-20%] right-[-15%] w-[80vw] h-[80vw] rounded-full mix-blend-normal animate-ambient-drift-2"
        style={{
          background: "radial-gradient(circle, #E5A93C, transparent 70%)",
          filter: "blur(90px)",
          opacity: "calc(var(--orb-opacity) * 2.2)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
          contain: "strict",
        }}
      />
      {/* Orb 3: Prestigious Violet */}
      <div 
        className="absolute top-[35%] right-[-10%] w-[55vw] h-[55vw] rounded-full mix-blend-normal animate-ambient-drift-1"
        style={{
          background: "radial-gradient(circle, var(--violet), transparent 70%)",
          filter: "blur(100px)",
          opacity: "calc(var(--orb-opacity) * 2.0)",
          willChange: "transform",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
          contain: "strict",
        }}
      />
    </div>
  );
}
