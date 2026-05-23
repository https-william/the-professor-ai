"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import UploadZone from "./UploadZone";

export default function FinalCTA() {
  const handleFileSelected = (file: File) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pending_upload_name", file.name);
    }
    window.location.href = "/signup";
  };

  return (
    <section id="get-started" className="relative w-full py-20 px-4 md:px-8 lg:px-12 bg-transparent max-w-5xl mx-auto overflow-hidden">
      <div className="relative z-10 w-full">
        {/* Glow backdrop inside the CTA card */}
        <div className="p-8 sm:p-20 text-center relative overflow-hidden border border-[var(--blue-border)] rounded-[40px] bg-gradient-to-br from-[var(--blue-dim)] to-[var(--bg)] shadow-md">
          
          {/* Subtle background icon */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-blue-500 pointer-events-none select-none">
            <Sparkles size={240} />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="font-sans text-[10px] font-extrabold tracking-[0.4em] text-blue-500 uppercase">
              Get Started
            </span>
            
            <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] leading-none tracking-tight max-w-2xl">
              Ready to take <br className="sm:hidden" />
              <span className="text-blue-500 text-shadow-[0_0_40px_rgba(59,130,246,0.15)]">a break?</span>
            </h2>

            <p className="font-sans text-xs md:text-sm lg:text-base font-medium text-[var(--foreground-secondary)] opacity-85 leading-relaxed max-w-md">
              Drop your notes here and get <span className="text-blue-500 font-extrabold">just the good parts</span>. You've got better things to do than re-reading notes all night. Like literally anything else.
            </p>

            {/* Upload Zone container */}
            <div className="w-full max-w-md mt-6 mb-8 flex justify-center">
              <UploadZone onFileSelected={handleFileSelected} />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/signup"
                className="px-10 py-5 text-[14px] font-black uppercase tracking-[0.15em] rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] hover-lift-md transition-all duration-300"
              >
                Create Scholar Account
              </Link>
              <Link
                href="/login"
                className="px-10 py-5 text-[13px] font-bold uppercase tracking-[0.1em] rounded-2xl border border-[var(--border)] bg-[var(--bg-2)] hover:bg-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] active:scale-[0.98] transition-all duration-200"
              >
                Return to Workspace
              </Link>
            </div>

            {/* Social Proof Footer */}
            <div className="mt-12 pt-6 border-t border-[var(--border)]/50 w-full max-w-sm flex flex-col items-center gap-3">
              <div className="flex -space-x-2.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div 
                    key={i} 
                    className="w-9 h-9 rounded-full border-2 border-[var(--bg-2)] bg-[var(--bg-3)] flex items-center justify-center overflow-hidden font-sans text-[10px] font-black text-blue-400 select-none shadow-sm"
                  >
                    {["C", "F", "K", "N", "E"][i-1]}
                  </div>
                ))}
              </div>
              <p className="font-sans text-[11px] text-[var(--foreground-muted)] font-bold">
                Chinedu, Fatima, Kunle, Nkechi and 400+ others are acing their classes with us.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
