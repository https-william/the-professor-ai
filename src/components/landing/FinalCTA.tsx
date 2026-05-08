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
      background: "var(--bg)",
      padding: "clamp(80px, 12vw, 120px) clamp(24px, 6vw, 80px)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background radial glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 80% 70% at 50% 50%, var(--blue-glow) 0%, transparent 70%)",
        pointerEvents: "none",
        opacity: 0.4
      }} />

      <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <span className="section-label" style={{ textAlign: "center", color: "var(--blue)" }}>GET STARTED</span>

        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 900,
          color: "var(--text)",
          marginTop: "12px",
          letterSpacing: "-0.03em"
        }}>
          Your exam won&apos;t wait. <span style={{ color: "var(--blue)" }}>Neither should you.</span>
        </h2>

        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "16px",
          color: "var(--text-2)",
          maxWidth: "520px",
          margin: "16px auto 0",
          lineHeight: 1.7,
          fontWeight: 500
        }}>
          Upload your notes now. No account. No commitment. The Professor reads, extracts, and builds — you study smarter.
        </p>

        {/* Upload Zone */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "48px" }}>
          <UploadZone compact onFileSelected={handleFileSelected} />
        </div>

        {/* Or separator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          maxWidth: "300px",
          margin: "32px auto",
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* CTA Button */}
        <Link
          href="/signup"
          className="btn-jelly-primary"
          style={{ width: "240px", fontSize: "14px", padding: "16px 32px", textDecoration: "none", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          Create Free Account →
        </Link>

        {/* Social proof footer */}
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: "var(--text-3)",
          marginTop: "24px",
          fontWeight: 600
        }}>
          Join 1,200+ students already using The Professor
        </p>
      </div>
    </section>
  );
}
