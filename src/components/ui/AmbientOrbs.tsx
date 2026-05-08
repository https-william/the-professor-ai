"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AmbientOrbs() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Don't show on the landing page if the user doesn't want it there, 
  // but they said "all over the app", so let's just make it subtle everywhere.
  // We can add a class that handles light/dark mode opacity.

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-[0]"
      aria-hidden="true"
    >
      <div 
        className="absolute top-[-20%] left-[-15%] w-[80vw] h-[80vw] rounded-full mix-blend-normal animate-ambient-drift-1"
        style={{
          background: "radial-gradient(circle, var(--blue), transparent 70%)",
          filter: "blur(140px)",
          opacity: "calc(var(--orb-opacity) * 0.5)",
          willChange: "transform",
        }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-15%] w-[90vw] h-[90vw] rounded-full mix-blend-normal animate-ambient-drift-2"
        style={{
          background: "radial-gradient(circle, #F59E0B, transparent 70%)",
          filter: "blur(160px)",
          opacity: "calc(var(--orb-opacity) * 0.4)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
