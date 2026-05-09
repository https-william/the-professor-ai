"use client";

import React from "react";
import Link from "next/link";
import UploadZone from "./UploadZone";

export default function FinalCTA() {
  const handleFileSelected = (file: File) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pending_upload_name", file.name);
    }
    window.location.href = "/signup";
  };

  return (
    <section style={{
      background: "transparent",
      padding: "clamp(100px, 15vw, 160px) clamp(24px, 6vw, 80px)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="scholar-card p-10 sm:p-24 text-center overflow-hidden border-[var(--blue-border)]" style={{ borderRadius: "48px", background: "linear-gradient(165deg, var(--blue-dim), var(--bg))" }}>
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[var(--blue)] pointer-events-none"><Sparkles size={200} /></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="section-label mb-6" style={{ color: "var(--blue)", letterSpacing: "0.4em" }}>THE FINAL CHAPTER</span>

            <h2 className="mb-8" style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              color: "var(--foreground)",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              maxWidth: "800px"
            }}>
              Your exam won&apos;t wait. <br />
              <span style={{ color: "var(--blue)", textShadow: "0 0 40px var(--blue-glow)" }}>Neither should you.</span>
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
              Upload your material and get an elite study guide, summary, and active-recall game — <span className="text-[var(--foreground)] font-bold">in seconds.</span>
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
            <div className="mt-16 pt-8 border-t border-[var(--border)] w-full max-w-md flex items-center justify-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--bg)] bg-[var(--text-4)]" />
                ))}
              </div>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--foreground-muted)",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase"
              }}>
                Hundreds of Scholars Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
