"use client";

import React, { useState, useRef } from "react";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number; // Maximum tilt rotation in degrees
  scale?: number; // Scale on hover
  glowColor?: string; // Color of the reflection glow
  glowOpacity?: number; // Opacity of the reflection glow
  borderRadius?: string; // Border radius CSS value
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 5,
  scale = 1.02,
  glowColor = "rgba(255, 255, 255, 0.15)",
  glowOpacity = 0.25,
  borderRadius = "28px",
  style = {},
  ...props
}: TiltCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowX, setGlowX] = useState(0);
  const [glowY, setGlowY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate tilt angles based on mouse offset from center
    const tiltX = ((centerY - y) / centerY) * maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    setRotateX(tiltX);
    setRotateY(tiltY);

    // Track percentage position of the mouse for the glow reflection
    setGlowX((x / rect.width) * 100);
    setGlowY((y / rect.height) * 100);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-all duration-300 ease-out select-none cursor-pointer ${className}`}
      style={{
        ...style,
        perspective: "1200px",
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? scale : 1})`,
        transformStyle: "preserve-3d",
        borderRadius,
      }}
      {...props}
    >
      {/* 2.5D Light sweep reflection */}
      {isHovered && (
        <>
          {/* Radial mouse reflection glow */}
          <div
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 mix-blend-overlay"
            style={{
              borderRadius,
              background: `radial-gradient(circle 220px at ${glowX}% ${glowY}%, ${glowColor}, transparent 80%)`,
              opacity: glowOpacity,
            }}
          />
          {/* Dynamic refraction glare sweep */}
          <div
            className="absolute inset-0 pointer-events-none z-35 transition-opacity duration-300 mix-blend-color-dodge"
            style={{
              borderRadius,
              background: `linear-gradient(135deg, transparent 35%, rgba(255, 255, 255, 0.06) 45%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.06) 55%, transparent 65%)`,
              backgroundSize: "200% 200%",
              backgroundPosition: `${(glowX - 50) * 1.5}% ${(glowY - 50) * 1.5}%`,
              opacity: glowOpacity * 0.8,
            }}
          />
        </>
      )}
      
      {/* Content wrapper */}
      <div style={{ transform: "translateZ(10px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </div>
  );
}
