"use client";

import React, { useState, useRef } from "react";
import { Share2, Download, Check, Sparkles, Loader2 } from "lucide-react";
import GlassmorphicCard from "./GlassmorphicCard";

export interface ShareCardGeneratorProps {
  title?: string;
  stats: {
    label: string;
    value: string | number;
    suffix?: string;
  }[];
  userName?: string;
  className?: string;
}

export default function ShareCardGenerator({
  title = "Study Sprint Complete",
  stats = [],
  userName = "Scholar",
  className = "",
}: ShareCardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateAndDownload = async () => {
    setIsGenerating(true);
    try {
      // Use Canvas API to draw a stunning high-resolution social share card
      const canvas = document.createElement("canvas");
      // Use high DPI (2x) for sharp text/icons
      const dpr = 2;
      const width = 600;
      const height = 400;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");
      
      ctx.scale(dpr, dpr);

      // 1. Draw Volcanic Dark Background Gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.8);
      bgGrad.addColorStop(0, "#1c1917"); // Volcanic stone dark
      bgGrad.addColorStop(1, "#09090b"); // Zinc 950 deep dark
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Decorative Amber Glow Orbs
      ctx.fillStyle = "rgba(229, 169, 60, 0.05)";
      ctx.beginPath();
      ctx.arc(width - 50, 50, 150, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Premium Glowing Amber Border
      ctx.strokeStyle = "rgba(229, 169, 60, 0.25)";
      ctx.lineWidth = 2;
      // Draw rounded corner outline
      ctx.beginPath();
      const radius = 28;
      ctx.roundRect(15, 15, width - 30, height - 30, radius);
      ctx.stroke();

      // 4. Branding Header
      ctx.fillStyle = "#E5A93C"; // Brand Amber
      ctx.font = "italic 900 12px Arial, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText("THE PROFESSOR AI", 40, 40);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 9px Arial, sans-serif";
      ctx.fillText("|  YOUR NOTES. JUST THE GOOD PARTS.", 175, 42);

      // 5. Title / User Greeting
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.fillText(title, 40, 80);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "bold 14px Arial, sans-serif";
      ctx.fillText(`Certified Study Sprint by ${userName}`, 40, 115);

      // 6. Draw Stats Grid
      const colWidth = (width - 80) / Math.max(1, stats.length);
      stats.forEach((stat, idx) => {
        const x = 40 + idx * colWidth;
        const y = 180;

        // Draw Stat Box Outline
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.beginPath();
        ctx.roundRect(x, y, colWidth - 15, 110, 16);
        ctx.fill();
        ctx.stroke();

        // Draw Stat Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "bold 10px Arial, sans-serif";
        ctx.fillText(stat.label.toUpperCase(), x + 15, y + 20);

        // Draw Stat Value
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px Arial, sans-serif";
        ctx.fillText(`${stat.value}${stat.suffix || ""}`, x + 15, y + 42);
      });

      // 7. Footer Watermark
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = "10px Arial, sans-serif";
      ctx.fillText("Earned in the Library", 40, height - 55);

      // Convert Canvas to Blob/DataURL and download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${userName.toLowerCase()}-study-card.png`;
      link.href = dataUrl;
      link.click();

      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (e) {
      console.error("Failed to render share image:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <GlassmorphicCard
      intensity="medium"
      radius="24px"
      className={`p-6 border border-white/5 flex flex-col gap-4 max-w-md w-full mx-auto ${className}`}
    >
      {/* Visual Card Preview */}
      <div 
        ref={cardRef}
        className="w-full aspect-[1.5] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between border border-white/10"
        style={{
          background: "radial-gradient(circle at 50% 50%, #1c1917 0%, #09090b 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#E5A93C]/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5A93C] italic">
              The Professor
            </span>
            <span className="text-[9px] font-bold text-white/30">| SOCIAL CARD</span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-[#E5A93C] animate-pulse" />
        </div>

        {/* Card Body */}
        <div className="flex flex-col gap-1.5 my-4 z-10">
          <h3 className="text-xl font-black italic text-white tracking-wide uppercase">
            {title}
          </h3>
          <span className="text-[11px] text-white/50 font-medium">
            Scholar: <span className="text-white font-bold">{userName}</span>
          </span>
        </div>

        {/* Card Stats Grid */}
        <div className="grid grid-cols-3 gap-2 z-10">
          {stats.map((stat, idx) => (
            <div 
              key={idx}
              className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col gap-0.5"
            >
              <span className="text-[8px] font-black text-white/30 uppercase tracking-wider line-clamp-1">
                {stat.label}
              </span>
              <span className="text-lg font-black text-white tracking-tight">
                {stat.value}
                <span className="text-xs font-semibold ml-0.5 text-white/70">
                  {stat.suffix}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Trigger Buttons */}
      <div className="flex gap-3">
        <button
          onClick={generateAndDownload}
          disabled={isGenerating}
          className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ background: "#E5A93C" }}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasCopied ? (
            <>
              <Check className="w-4 h-4" /> Card Saved!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Download Card
            </>
          )}
        </button>
      </div>
    </GlassmorphicCard>
  );
}
