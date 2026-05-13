"use client";

import { useEffect } from "react";

/**
 * Tracks the mouse pointer across the global window and assigns
 * --mouse-x and --mouse-y CSS variables to the document root.
 * This powers the Dynamic Glass Refraction on .glass-panel elements.
 * 
 * Performance: Throttled via rAF, passive listener, and only updates
 * on desktop (touch devices get a static center fallback).
 */
export default function GlassRefractionProvider() {
  useEffect(() => {
    // Skip mouse tracking on touch devices — reduces overhead
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Set sensible defaults
    document.documentElement.style.setProperty("--mouse-x", "50%");
    document.documentElement.style.setProperty("--mouse-y", "50%");

    if (isTouchDevice) return;

    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const x = (e.clientX / window.innerWidth) * 100;
          const y = (e.clientY / window.innerHeight) * 100;

          document.documentElement.style.setProperty("--mouse-x", `${x}%`);
          document.documentElement.style.setProperty("--mouse-y", `${y}%`);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return null;
}
