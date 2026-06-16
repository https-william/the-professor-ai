"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AmbientOrbs from "@/components/ui/AmbientOrbs";
import ScholarShaderCanvas from "@/components/ui/ScholarShaderCanvas";
import { cn } from "@/lib/utils";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export default function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const pathname = usePathname();

  // Determine if the current page belongs to marketing or authentication
  const isMarketingOrAuth =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/glossary") ||
    pathname.startsWith("/best-ai-for") ||
    pathname.startsWith("/tools");

  return (
    <main
      className={cn(
        "platform-main-container relative min-h-screen w-full flex flex-col flex-1 transition-all duration-500",
        isMarketingOrAuth
          ? "bg-transparent backdrop-blur-none border-none shadow-none"
          : "bg-zinc-950/70 backdrop-blur-md border border-zinc-800/50"
      )}
    >
      <div className="noise-overlay" />

      {/* Conditionally render the WebGL Shader or Ambient Orbs */}
      {isMarketingOrAuth ? (
        <ScholarShaderCanvas />
      ) : (
        <AmbientOrbs />
      )}

      {children}
    </main>
  );
}
