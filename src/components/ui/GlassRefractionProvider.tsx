"use client";

import { useEffect } from "react";

/**
 * Tracks the mouse pointer across the global window and assigns
 * --mouse-x and --mouse-y CSS variables to the document root.
 * This powers the Dynamic Glass Refraction on .glass-panel elements.
 */
export default function GlassRefractionProvider() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      document.documentElement.style.setProperty("--mouse-x", `${x}%`);
      document.documentElement.style.setProperty("--mouse-y", `${y}%`);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Initial fallback if they never move mouse
    document.documentElement.style.setProperty("--mouse-x", "50%");
    document.documentElement.style.setProperty("--mouse-y", "50%");

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return null;
}
