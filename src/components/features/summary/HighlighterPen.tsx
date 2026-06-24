"use client";

import React, { useState, useEffect, useRef } from "react";
import { HighlightColor, HIGHLIGHT_COLORS } from "@/lib/design-tokens";

export interface HighlighterPenProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onHighlight: (text: string, color: HighlightColor) => void;
}

export default function HighlighterPen({
  containerRef,
  onHighlight,
}: HighlighterPenProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      // Small timeout to allow selection API to populate
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          setPosition(null);
          setSelectedText("");
          return;
        }

        const text = selection.toString().trim();
        if (!text || text.length < 3) {
          setPosition(null);
          setSelectedText("");
          return;
        }

        // Verify selection is inside the container
        const container = containerRef.current;
        if (container && !container.contains(selection.anchorNode)) {
          setPosition(null);
          setSelectedText("");
          return;
        }

        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Position tooltip above selection center
          setPosition({
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top - 46 + window.scrollY,
          });
          setSelectedText(text);
        } catch (e) {
          setPosition(null);
          setSelectedText("");
        }
      }, 50);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText("");
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerRef]);

  const handleColorClick = (color: HighlightColor) => {
    if (selectedText) {
      onHighlight(selectedText, color);
      
      // Clear selection
      window.getSelection()?.removeAllRanges();
      setPosition(null);
      setSelectedText("");
    }
  };

  if (!position) return null;

  return (
    <div
      ref={tooltipRef}
      className="absolute z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-zinc-950/90 border border-white/10 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-150 -translate-x-1/2 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), 0 0 10px rgba(229, 169, 60, 0.1)",
      }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent closing tooltip instantly on click
    >
      {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => {
        const style = HIGHLIGHT_COLORS[color];
        return (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            className="w-5 h-5 rounded-full border border-white/10 hover:scale-125 transition-transform"
            style={{
              background: style.bg.replace("0.20", "0.85"),
              borderColor: style.border,
            }}
            title={`Highlight ${color}`}
          />
        );
      })}
    </div>
  );
}
