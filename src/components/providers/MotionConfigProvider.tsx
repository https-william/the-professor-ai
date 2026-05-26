"use client";

import { MotionConfig } from "framer-motion";
import React, { useEffect, useState } from "react";

export default function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState<"user" | "always">("user");

  useEffect(() => {
    // Detect low-end memory (<= 2GB) or slow CPU (<= 4 cores)
    const isLowEnd = 
      (typeof navigator !== "undefined" && 
        (((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2) || 
         (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2))) ||
      (typeof window !== "undefined" && 
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
         
    if (isLowEnd) {
      console.info("Low-spec hardware or reduced motion setting detected. Forcing reduced motion globally.");
      setReduced("always");
    }
  }, []);

  return (
    <MotionConfig reducedMotion={reduced}>
      {children}
    </MotionConfig>
  );
}
