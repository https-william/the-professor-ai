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
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp3,.m4a,.wav"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Icon SVG */}
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ color: "rgba(245,158,11,0.65)" }}
      >
        <rect x="8" y="6" width="22" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M19 26V16M19 16L15 20M19 16L23 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 10H25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>

      <p style={{
        fontFamily: "'Outfit', var(--font-outfit), sans-serif",
        fontSize: "16px",
        fontWeight: 700,
        color: "#F5F0E8",
        marginTop: "4px"
      }}>
        Drop your notes here
      </p>

      <p style={{
        fontFamily: "'Outfit', var(--font-outfit), sans-serif",
        fontSize: "12px",
        fontWeight: 400,
        color: "rgba(245,240,232,0.38)"
      }}>
        PDF · Word · Images · Voice recordings
      </p>

      <p style={{
        fontFamily: "'Outfit', var(--font-outfit), sans-serif",
        fontSize: "12px",
        fontWeight: 400,
        color: "rgba(245,158,11,0.5)",
        textDecoration: "underline",
        textDecorationStyle: "dotted" as const,
        cursor: "pointer"
      }}>
        or click to browse files
      </p>
    </div>
  );
}
