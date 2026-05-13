"use client";

import React, { useState, useRef, useCallback } from "react";

interface UploadZoneProps {
  compact?: boolean;
  onFileSelected?: (file: File) => void;
}

export default function UploadZone({ compact, onFileSelected }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileSelected) onFileSelected(file);
  }, [onFileSelected]);

  const handleClick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelected) onFileSelected(file);
  };

  return (
    <div
      className={`upload-zone ${isDragOver ? "drag-over" : ""} ${compact ? "compact" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      style={{
        position: "relative",
        background: isDragOver ? "var(--blue-dim)" : "var(--bg-2)",
        backgroundImage: "linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)",
        border: `1.5px dashed ${isDragOver ? 'var(--blue)' : 'var(--border-3)'}`,
        borderRadius: "28px",
        padding: compact ? "20px" : "clamp(32px, 8vh, 60px) 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        boxShadow: isDragOver 
          ? "0 0 40px var(--blue-glow), inset 0 0 12px var(--blue-dim)" 
          : "0 10px 30px -10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
        width: "100%",
        maxWidth: compact ? "none" : "540px",
        overflow: "hidden"
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.pptx"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Decorative Blur Orb inside */}
      <div style={{
        position: "absolute",
        top: "-20%",
        left: "-20%",
        width: "60%",
        height: "60%",
        background: "var(--blue-glow)",
        filter: "blur(60px)",
        opacity: isDragOver ? 0.3 : 0.1,
        pointerEvents: "none",
        transition: "opacity 0.4s ease"
      }} />

      {/* Upload Icon — Refined */}
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "20px",
        background: "var(--bg-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px",
        border: "1px solid var(--border-2)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.05)",
        transform: isDragOver ? "scale(1.1) rotate(5deg)" : "scale(1)",
        transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 15V16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V15" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <p style={{
        fontFamily: "var(--font-heading)",
        fontSize: "20px",
        fontWeight: 800,
        color: "var(--text)",
        letterSpacing: "-0.02em"
      }}>
        Drop your notes here
      </p>

      <p style={{
        fontFamily: "var(--font-sans)",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--text-3)",
        marginTop: "6px"
      }}>
        PDF · PPTX · Word · Images
      </p>

      <div style={{
        marginTop: "24px",
        fontFamily: "var(--font-sans)",
        fontSize: "13px",
        fontWeight: 700,
        color: "white",
        background: "var(--blue)",
        padding: "10px 24px",
        borderRadius: "99px",
        boxShadow: "0 4px 12px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        transition: "all 0.2s ease"
      }}>
        or click to browse
      </div>
    </div>
  );
}
