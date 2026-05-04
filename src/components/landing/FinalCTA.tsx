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
      background: "#08080E",
      padding: "clamp(80px, 12vw, 120px) clamp(24px, 6vw, 80px)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background radial glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <span className="section-label" style={{ textAlign: "center" }}>GET STARTED</span>

        <h2 style={{
          fontFamily: "'Galaxie Copernicus','Source Serif 4',Georgia,serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 500,
          color: "#F5F0E8",
          marginTop: 0,
        }}>
          Your exam won&apos;t wait. Neither should you.
        </h2>

        <p style={{
          fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif",
          fontSize: "16px",
          color: "rgba(245,240,232,0.55)",
          maxWidth: "520px",
          margin: "16px auto 0",
          lineHeight: 1.7,
        }}>
          Upload your notes now. No account. No card. No commitment. The Professor reads, extracts, and builds — you study smarter.
        </p>

        {/* Upload Zone */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "36px" }}>
          <UploadZone compact onFileSelected={handleFileSelected} />
        </div>

        {/* Or separator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          maxWidth: "300px",
          margin: "20px auto",
        }}>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(245,240,232,0.1)" }} />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", color: "rgba(245,240,232,0.3)" }}>or</span>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(245,240,232,0.1)" }} />
        </div>

        {/* CTA Button */}
        <Link
          href="/signup"
          className="btn-jelly-primary"
          style={{ width: "240px", fontSize: "15px", padding: "12px 32px", textDecoration: "none" }}
        >
          Create a free account →
        </Link>

        {/* Social proof footer */}
        <p style={{
          fontFamily: "'Outfit',sans-serif",
          fontSize: "12px",
          color: "rgba(245,240,232,0.3)",
          marginTop: "14px",
        }}>
          Joins 1,200+ Nigerian students already using The Professor
        </p>
      </div>
    </section>
  );
}
