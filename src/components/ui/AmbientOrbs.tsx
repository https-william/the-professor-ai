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
      <div 
        className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full mix-blend-normal animate-ambient-drift-1"
        style={{
          background: "radial-gradient(circle, var(--blue), transparent 70%)",
          filter: "blur(100px)",
          opacity: "calc(var(--orb-opacity) * 0.5)",
          willChange: "transform",
          contain: "strict",
        }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-15%] w-[80vw] h-[80vw] rounded-full mix-blend-normal animate-ambient-drift-2"
        style={{
          background: "radial-gradient(circle, #F59E0B, transparent 70%)",
          filter: "blur(120px)",
          opacity: "calc(var(--orb-opacity) * 0.4)",
          willChange: "transform",
          contain: "strict",
        }}
      />
    </div>
  );
}
