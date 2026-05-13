"use client";

import React from "react";

const ROW1 = [
  { name: "Sarah K.", uni: "University of Toronto", quote: "Finished Biology guide in 8 minutes" },
  { name: "Liam M.", uni: "King's College London", quote: "The quiz exposed everything I didn't know" },
  { name: "Elena F.", uni: "Stanford University", quote: "More useful than 3 hours in the library" },
  { name: "Marcus J.", uni: "Sydney University", quote: "Shared it with my entire study group" },
  { name: "Yuki N.", uni: "Tokyo University", quote: "The match game is weirdly addictive" },
  { name: "Fatimah B.", uni: "Zayed University", quote: "Study guide matched what actually came out" },
  { name: "Chloe M.", uni: "Sorbonne University", quote: "My coursemates keep asking where I got this" },
  { name: "David U.", uni: "University of Cape Town", quote: "Chemistry was going to fail me. Not anymore." },
  { name: "Sofia E.", uni: "Complutense University", quote: "I upload every lecture note now. Every single one." },
];

const ROW2 = [
  { name: "Damilola A.", uni: "McGill University", quote: "Anatomy revision went from 6 hours to 45 mins" },
  { name: "Lucas C.", uni: "TUM Munich", quote: "The summary is perfect for quick revision" },
  { name: "Maya S.", uni: "National University of Singapore", quote: "I sent it to my whole class and they loved it" },
  { name: "Daniel O.", uni: "ETH Zurich", quote: "Quiz mode is harder than the actual exam" },
  { name: "Alex T.", uni: "Peking University", quote: "This is the only AI tool that gets complex theory" },
  { name: "Priscilla E.", uni: "Melbourne Uni", quote: "Three friends signed up after I showed them mine" },
  { name: "Javier B.", uni: "UNAM Mexico", quote: "First time I felt actually ready the night before" },
  { name: "Miriam A.", uni: "Hebrew University", quote: "Physics finally makes sense" },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function TickerCard({ name, uni, quote }: { name: string; uni: string; quote: string }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "12px",
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
      borderRadius: "1.25rem",
      padding: "12px 18px",
      marginRight: "12px",
      whiteSpace: "nowrap",
      flexShrink: 0,
      maxWidth: "320px",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      {/* Avatar */}
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "var(--blue-dim)",
        border: "1px solid var(--blue-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          fontWeight: 800,
          color: "var(--blue)",
        }}>
          {getInitials(name)}
        </span>
      </div>

      {/* Text */}
      <div style={{ overflow: "hidden" }}>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          fontWeight: 800,
          color: "var(--text)",
          letterSpacing: "-0.01em"
        }}>
          {name} <span style={{ color: "var(--text-3)", fontWeight: 500 }}>— {uni}</span>
        </div>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: "var(--text-2)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "220px",
          fontWeight: 500,
          fontStyle: "italic"
        }}>
          "{quote}"
        </div>
      </div>
    </div>
  );
}

function TickerRow({ cards, reverse }: { cards: typeof ROW1; reverse?: boolean }) {
  return (
    <div className="ticker-row" style={{ overflow: "hidden", position: "relative" }}>
      <div 
        className={reverse ? "ticker-track-reverse" : "ticker-track"}
        style={{ willChange: "transform" }}
      >
        {/* Original + Duplicate for seamless loop */}
        {[...cards, ...cards].map((card, i) => (
          <TickerCard key={i} {...card} />
        ))}
      </div>
    </div>
  );
}

export default function SocialProof() {
  return (
    <section style={{
      background: "var(--bg)",
      padding: "64px 0",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      overflow: "hidden",
      position: "relative",
      contain: "content",
    }}>
      <div className="edge-fade-mask" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <TickerRow cards={ROW1} />
        <TickerRow cards={ROW2} reverse />
      </div>
    </section>
  );
}

