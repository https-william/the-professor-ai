"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
          : "bg-zinc-950/40 backdrop-blur-sm border-none"
      )}
    >
      <div className="noise-overlay" />

      {/* WebGL Shader on all routes — dimmer on app routes for subtlety */}
      <ScholarShaderCanvas opacity={isMarketingOrAuth ? 0.60 : 0.35} />

      {children}
    </main>
  );
}
