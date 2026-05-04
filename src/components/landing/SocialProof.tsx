"use client";

import React from "react";

const ROW1 = [
  { name: "Adaeze O.", uni: "UNN", quote: "Finished ECO 201 guide in 8 minutes" },
  { name: "Tomiwa A.", uni: "CU", quote: "The quiz exposed everything I didn't know" },
  { name: "Emeka F.", uni: "UNILAG", quote: "More useful than 3 hours in the library" },
  { name: "Amaka I.", uni: "UI", quote: "Shared it with my entire study group" },
  { name: "Chisom N.", uni: "FUTA", quote: "The match game is weirdly addictive" },
  { name: "Fatimah B.", uni: "ABU", quote: "Study guide matched what actually came out" },
  { name: "Seun M.", uni: "LASU", quote: "My coursemates keep asking where I got this" },
  { name: "Kelechi U.", uni: "UNIPORT", quote: "CHM 201 was going to fail me. Not anymore." },
  { name: "Ngozi E.", uni: "OAU", quote: "I upload every lecture note now. Every single one." },
];

const ROW2 = [
  { name: "Damilola A.", uni: "LUTH", quote: "Anatomy revision went from 6 hours to 45 mins" },
  { name: "Obiageli C.", uni: "UNIBEN", quote: "The summary is perfect for quick revision" },
  { name: "Hassan M.", uni: "BUK", quote: "I sent it to my whole class and they loved it" },
  { name: "Blessing O.", uni: "FUNAAB", quote: "Quiz mode is harder than the actual exam" },
  { name: "Akin T.", uni: "YABATECH", quote: "This is the only AI tool that gets Nigerian courses" },
  { name: "Priscilla E.", uni: "UNILAG", quote: "Three friends signed up after I showed them mine" },
  { name: "Rotimi B.", uni: "UI", quote: "First time I felt actually ready the night before" },
  { name: "Miriam A.", uni: "ABU", quote: "PHY 102 finally makes sense" },
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
      background: "rgba(18,18,31,0.85)",
      border: "1px solid rgba(245,240,232,0.08)",
      borderRadius: "1rem",
      padding: "12px 18px",
      marginRight: "12px",
      whiteSpace: "nowrap",
      flexShrink: 0,
      maxWidth: "290px",
      overflow: "hidden",
    }}>
      {/* Avatar */}
      <div style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #1c1c30, #12121F)",
        border: "1px solid rgba(245,240,232,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          color: "rgba(245,240,232,0.5)",
        }}>
          {getInitials(name)}
        </span>
      </div>

      {/* Text */}
      <div style={{ overflow: "hidden" }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "12px",
          fontWeight: 700,
          color: "#F5F0E8",
        }}>
          {name} — {uni}
        </div>
        <div style={{
          fontFamily: "'Tiempos Text', 'Source Serif 4', Georgia, serif",
          fontSize: "12px",
          color: "rgba(245,240,232,0.5)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "200px",
        }}>
          {quote}
        </div>
      </div>
    </div>
  );
}

function TickerRow({ cards, reverse }: { cards: typeof ROW1; reverse?: boolean }) {
  return (
    <div className="ticker-row" style={{ overflow: "hidden", position: "relative" }}>
      <div className={reverse ? "ticker-track-reverse" : "ticker-track"}>
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
      background: "#08080E",
      padding: "48px 0",
      borderTop: "0.5px solid rgba(245,240,232,0.06)",
      borderBottom: "0.5px solid rgba(245,240,232,0.06)",
      overflow: "hidden",
      position: "relative",
    }}>
      <div className="edge-fade-mask" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <TickerRow cards={ROW1} />
        <TickerRow cards={ROW2} reverse />
      </div>
    </section>
  );
}
