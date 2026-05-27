"use client";

import { MotionConfig } from "framer-motion";
import React, { useEffect, useState } from "react";

export default function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState<"user" | "always">("user");

  useEffect(() => {
    const hasDeviceMemory = typeof navigator !== "undefined" && (navigator as any).deviceMemory !== undefined;
    const deviceMemory = hasDeviceMemory ? (navigator as any).deviceMemory : 8; // fallback to 8GB
    const hasHardwareConcurrency = typeof navigator !== "undefined" && navigator.hardwareConcurrency !== undefined;
    const hardwareConcurrency = hasHardwareConcurrency ? navigator.hardwareConcurrency : 8; // fallback to 8 cores

    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isLowEnd = (deviceMemory <= 2) || (hardwareConcurrency <= 2) || prefersReducedMotion;
         
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
