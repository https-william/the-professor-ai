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
    <section id="get-started" style={{
      background: "transparent",
      padding: "clamp(100px, 15vw, 160px) clamp(24px, 6vw, 80px)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="p-10 sm:p-24 text-center overflow-hidden border border-[var(--blue-border)] shadow-sm" style={{ borderRadius: "48px", background: "linear-gradient(165deg, var(--blue-dim), var(--bg))" }}>
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[var(--blue)] pointer-events-none"><Sparkles size={200} /></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="section-label mb-6" style={{ color: "var(--blue)", letterSpacing: "0.4em" }}>GET STARTED</span>
            <h2 className="mb-8" style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              color: "var(--foreground)",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              maxWidth: "800px"
            }}>
              Ready to take <br />
              <span style={{ color: "var(--blue)", textShadow: "0 0 40px var(--blue-glow)" }}>a break?</span>
            </h2>
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
              color: "var(--foreground-secondary)",
              maxWidth: "540px",
              margin: "0 auto",
              lineHeight: 1.6,
              fontWeight: 500,
              opacity: 0.8
            }}>
              Drop your notes here and get <span className="text-[var(--blue)] font-bold">just the good parts</span>. You've got better things to do than re-reading notes all night. Like literally anything else.
            </p>

            {/* Upload Zone */}
            <div className="w-full max-w-lg mt-12 mb-16">
              <UploadZone onFileSelected={handleFileSelected} />
            </div>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link
                href="/signup"
                className="btn-jelly-primary px-10 py-5 text-[15px]"
                style={{ textDecoration: "none" }}
              >
                Create Scholar Account
              </Link>
              <Link
                href="/login"
                className="btn-skeuo px-10 py-5 text-[15px]"
                style={{ textDecoration: "none" }}
              >
                Return to Workspace
              </Link>
            </div>

            {/* Social proof footer */}
            <div className="mt-16 pt-8 border-t border-[var(--border)] w-full max-w-md flex flex-col items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--bg)] bg-[var(--text-4)] flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-[var(--blue-dim)] flex items-center justify-center text-[10px] font-black text-[var(--blue)]">
                      {["C", "F", "K", "N", "E"][i-1]}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                color: "var(--foreground-muted)",
                fontWeight: 600,
                opacity: 0.8
              }}>
                Chinedu, Fatima, Kunle, Nkechi and 400+ others are acing their classes with us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
