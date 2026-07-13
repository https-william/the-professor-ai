"use client";

import React from "react";

interface SpriteAnimatorProps {
  sheetUrl: string;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  durationMs: number;
  loop?: boolean;
  isPlaying?: boolean;
  className?: string;
  mixBlendMode?: "normal" | "screen" | "lighten" | "color-dodge";
}

export default function SpriteAnimator({
  sheetUrl,
  frameWidth,
  frameHeight,
  totalFrames,
  durationMs,
  loop = true,
  isPlaying = true,
  className = "",
  mixBlendMode = "screen",
}: SpriteAnimatorProps) {
  // Using background-position-x animation stepped frame-by-frame
  const animationStyle: React.CSSProperties = {
    width: `${frameWidth}px`,
    height: `${frameHeight}px`,
    backgroundImage: `url(${sheetUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${frameWidth * totalFrames}px ${frameHeight}px`,
    mixBlendMode: mixBlendMode,
    animation: isPlaying
      ? `sprite-step ${durationMs}ms steps(${totalFrames - 1}) ${loop ? "infinite" : "forwards"}`
      : "none",
  };

  return (
    <div 
      style={animationStyle} 
      className={`select-none pointer-events-none scale-100 ${className}`} 
    />
  );
}
