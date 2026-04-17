"use client";
import { Clock } from "lucide-react";

interface ReadingTimeProps {
  content: string;
  wpm?: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function calculateReadingTime(content: string, wpm: number = 200): number {
  if (!content || typeof content !== "string") return 0;
  
  // Strip markdown/HTML and count words
  const plainText = content
    .replace(/<[^>]*>/g, "")
    .replace(/[#*_`~\[\]()]/g, "")
    .trim();
  
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wpm);
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return "< 1 min read";
  if (minutes === 1) return "1 min read";
  if (minutes > 20) return `${minutes} min read`;
  return `${minutes} min read`;
}

export default function ReadingTime({
  content,
  wpm = 200,
  showIcon = true,
  size = "sm",
}: ReadingTimeProps) {
  const minutes = calculateReadingTime(content, wpm);
  const formatted = formatReadingTime(minutes);

  const sizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 ${sizes[size]}`}
      style={{ color: "rgba(255,255,255,0.35)" }}
    >
      {showIcon && (
        <Clock size={14} strokeWidth={1.5} />
      )}
      {formatted}
    </span>
  );
}

// Compact badge version for cards
export function ReadingTimeBadge({ content, wpm = 200 }: { content: string; wpm?: number }) {
  const minutes = calculateReadingTime(content, wpm);
  
  if (minutes === 0) return null;
  
  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium"
      style={{ 
        background: "rgba(99,102,241,0.1)", 
        color: "rgba(129,140,248,0.8)" 
      }}
    >
      <Clock size={10} strokeWidth={1.5} className="mr-1" />
      {minutes} min
    </span>
  );
}

// Word count helper
export function getWordCount(content: string): number {
  if (!content || typeof content !== "string") return 0;
  const plainText = content.replace(/<[^>]*>/g, "").trim();
  return plainText.split(/\s+/).filter(Boolean).length;
}

// Helper to get summary preview length
export function getPreviewText(content: string, maxLength: number = 150): string {
  if (!content) return "";
  const plainText = content.replace(/<[^>]*>/g, "").trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + "...";
}
