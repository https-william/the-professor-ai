"use client";

import React, { useMemo } from "react";
import UploadZone from "./UploadZone";

function StarField() {
  const stars = useMemo(() => {
    const seed = [
      { top: "8%", left: "12%", size: 1.5, bg: "var(--foreground)", opacity: 0.3, dur: "4.2s", delay: "0s" },
      { top: "15%", left: "85%", size: 2, bg: "var(--blue)", opacity: 0.35, dur: "5.8s", delay: "1.2s" },
      { top: "22%", left: "42%", size: 1, bg: "var(--foreground)", opacity: 0.2, dur: "6.5s", delay: "0.5s" },
      { top: "5%", left: "68%", size: 2.5, bg: "var(--foreground)", opacity: 0.4, dur: "3.8s", delay: "2.1s" },
      { top: "35%", left: "8%", size: 1.5, bg: "var(--blue)", opacity: 0.35, dur: "7.2s", delay: "0.8s" },
      { top: "40%", left: "92%", size: 1, bg: "var(--foreground)", opacity: 0.3, dur: "4.6s", delay: "3.0s" },
      { top: "55%", left: "18%", size: 2, bg: "var(--foreground)", opacity: 0.2, dur: "5.3s", delay: "1.8s" },
      { top: "60%", left: "75%", size: 1.5, bg: "var(--blue)", opacity: 0.35, dur: "6.8s", delay: "0.3s" },
      { top: "12%", left: "30%", size: 1, bg: "var(--foreground)", opacity: 0.4, dur: "4.0s", delay: "2.5s" },
      { top: "48%", left: "55%", size: 2, bg: "var(--foreground)", opacity: 0.2, dur: "7.5s", delay: "1.0s" },
      { top: "72%", left: "25%", size: 1.5, bg: "var(--blue)", opacity: 0.35, dur: "5.0s", delay: "3.5s" },
      { top: "80%", left: "65%", size: 1, bg: "var(--foreground)", opacity: 0.3, dur: "6.2s", delay: "0.7s" },
      { top: "18%", left: "55%", size: 2.5, bg: "var(--foreground)", opacity: 0.2, dur: "3.5s", delay: "2.8s" },
      { top: "30%", left: "38%", size: 1, bg: "var(--foreground)", opacity: 0.4, dur: "8.0s", delay: "1.5s" },
      { top: "65%", left: "42%", size: 1.5, bg: "var(--blue)", opacity: 0.35, dur: "4.8s", delay: "0.2s" },
      { top: "45%", left: "82%", size: 2, bg: "var(--foreground)", opacity: 0.3, dur: "5.5s", delay: "3.2s" },
      { top: "88%", left: "12%", size: 1, bg: "var(--foreground)", opacity: 0.2, dur: "7.0s", delay: "1.3s" },
      { top: "25%", left: "95%", size: 1.5, bg: "var(--blue)", opacity: 0.35, dur: "4.3s", delay: "2.0s" },
      { top: "70%", left: "88%", size: 2, bg: "var(--foreground)", opacity: 0.4, dur: "6.0s", delay: "0.9s" },
      { top: "52%", left: "5%", size: 1, bg: "var(--foreground)", opacity: 0.3, dur: "5.7s", delay: "3.8s" },
      { top: "38%", left: "70%", size: 2.5, bg: "var(--foreground)", opacity: 0.2, dur: "3.3s", delay: "1.6s" },
      { top: "85%", left: "48%", size: 1.5, bg: "var(--blue)", opacity: 0.35, dur: "7.8s", delay: "0.4s" },
      { top: "10%", left: "78%", size: 1, bg: "var(--foreground)", opacity: 0.4, dur: "4.5s", delay: "2.3s" },
      { top: "58%", left: "32%", size: 2, bg: "var(--foreground)", opacity: 0.2, dur: "6.3s", delay: "1.1s" },
      { top: "42%", left: "15%", size: 1.5, bg: "var(--blue)", opacity: 0.35, dur: "5.2s", delay: "3.4s" },
      { top: "75%", left: "58%", size: 1, bg: "var(--foreground)", opacity: 0.3, dur: "7.3s", delay: "0.6s" },
      { top: "20%", left: "22%", size: 2, bg: "var(--foreground)", opacity: 0.4, dur: "4.1s", delay: "2.7s" },
      { top: "92%", left: "35%", size: 1.5, bg: "var(--foreground)", opacity: 0.2, dur: "6.7s", delay: "1.4s" },
    ];
    return seed;
  }, []);

  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: "50%",
            background: s.bg,
            opacity: s.opacity,
            pointerEvents: "none",
            zIndex: 0,
            animation: `twinkle ${s.dur} ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </>
  );
}

export default function HeroSection() {
  const handleFileSelected = (file: File) => {
    // Store file reference and navigate to processing
    if (typeof window !== "undefined") {
      localStorage.setItem("pending_upload_name", file.name);
    }
    window.location.href = "/signup";
  };

  return (
    <section
      className="grain-overlay"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start", 
        minHeight: "100dvh",
        paddingTop: "clamp(120px, 15vh, 180px)",
        paddingBottom: "clamp(40px, 8vh, 80px)",
        paddingLeft: "clamp(20px, 6vw, 80px)",
        paddingRight: "clamp(20px, 6vw, 80px)",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      {/* Layer 1 — Radial Glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "140%",
          maxWidth: "1400px",
          height: "800px",
          background: "radial-gradient(ellipse at center top, rgba(37,99,235,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Layer 2 — Star Field */}
      <StarField />

      {/* Content Container */}
      <div style={{ 
        position: "relative", 
        zIndex: 1, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        width: "100%",
        maxWidth: "1100px",
        flexGrow: 1,
        justifyContent: "center",
        gap: "clamp(24px, 5vh, 48px)" // Systematic spacing
      }}>

        {/* Top Group: Badge + Headline + Subheadline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "clamp(12px, 3vh, 24px)" }}>
          {/* Pre-Headline Badge */}
          <div
            className="animate-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.22)",
              borderRadius: "9999px",
              padding: "6px 18px",
            }}
          >
            <span style={{ width: "7px", height: "7px", background: "var(--blue)", borderRadius: "50%", flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text-2)",
              letterSpacing: "0.04em",
            }}>
              Strategic AI · Built for the 3 AM grind
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className="animate-up"
            style={{
              textAlign: "center",
              maxWidth: "1000px",
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 10vw, 5.5rem)", 
              fontWeight: 900,
              lineHeight: 0.95,
              color: "var(--foreground)",
              letterSpacing: "-0.04em",
            }}
          >
            Drop your notes.<br />
            Walk into any exam{" "}
            <span style={{ color: "var(--blue)" }}>ready.</span>
          </h1>

          {/* Sub-Headline */}
          <p
            className="animate-up"
            style={{
              textAlign: "center",
              maxWidth: "560px",
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              fontWeight: 500,
              color: "var(--text-2)",
              lineHeight: 1.5,
            }}
          >
            Upload your material and get an elite study guide, summary, quiz, and active-recall game — in seconds.
          </p>
        </div>

        {/* Upload Drop Zone Container */}
        <div 
          className="animate-up" 
          style={{ 
            width: "100%",
            maxWidth: "540px",
            transitionDelay: "150ms" 
          }}
        >
          <UploadZone onFileSelected={handleFileSelected} />
        </div>

        {/* Trust Bar */}
        <div
          className="animate-up"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px 24px",
            transitionDelay: "300ms",
          }}
        >
          {[
            "No account required to start",
            "1,200+ students mastered",
            "Privacy-first strategy",
          ].map((item, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "6px", height: "6px",
                background: "var(--blue)",
                borderRadius: "50%",
                flexShrink: 0,
                opacity: 0.6
              }} />
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-3)",
              }}>
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="hidden md:flex"
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          zIndex: 1,
        }}
      >
        <div style={{
          width: "1px",
          height: "36px",
          background: "linear-gradient(180deg, var(--blue) 0%, transparent 100%)",
          animation: "scrollPulse 2.2s ease-in-out infinite",
        }} />
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--text-4)",
        }}>
          scroll
        </span>
      </div>
    </section>
  );
}
