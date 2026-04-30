"use client";

import { useState, useEffect, useCallback } from "react";

const CONVERSATIONS = [
  {
    question: "Explain Quantum Entanglement like I'm 5.",
    answer:
      "Imagine you have two magic socks. You put one in your drawer and mail the other to Grandma across the ocean. When you look at yours and it's red — Grandma's is INSTANTLY red too. Nobody peeked. They just... know. That's entanglement.",
  },
  {
    question: "What's the difference between mitosis and meiosis?",
    answer:
      'Mitosis is a photocopy machine — one cell becomes two identical twins. Meiosis is more like shuffling a deck of cards and dealing four unique hands. That\'s why siblings look different even though they have the same parents.',
  },
  {
    question: "Why did Rome fall?",
    answer:
      'Not one reason — it was a slow avalanche. Think of it like a Jenga tower: political corruption pulled one block, barbarian invasions pulled another, economic inflation yanked a third. Eventually there weren\'t enough blocks left to hold it up.',
  },
  {
    question: "How does compound interest work?",
    answer:
      "Picture a snowball rolling downhill. At first it's tiny and slow. But the snow that sticks to it also collects MORE snow. After a while, it's enormous — not because you pushed harder, but because growth builds on growth. That's your money compounding.",
  },
  {
    question: "Explain supply and demand simply.",
    answer:
      'Imagine there\'s one slice of pizza left at lunch and ten hungry students. That slice just became very valuable. Now imagine there are 50 slices and only 3 students — suddenly pizza is basically free. Price is just a tug-of-war between "how much is there" and "how badly do people want it."',
  },
];

export default function TerminalDemo() {
  const [convoIndex, setConvoIndex] = useState(0);
  const [phase, setPhase] = useState<"ready" | "typing-q" | "thinking" | "typing-a" | "done">("ready");
  const [displayedQ, setDisplayedQ] = useState("");
  const [displayedA, setDisplayedA] = useState("");

  const convo = CONVERSATIONS[convoIndex];

  const typeText = useCallback(
    (fullText: string, setter: (v: string) => void, speed: number): Promise<void> => {
      return new Promise((resolve) => {
        let i = 0;
        const tick = () => {
          if (i <= fullText.length) {
            setter(fullText.slice(0, i));
            i++;
            setTimeout(tick, speed);
          } else {
            resolve();
          }
        };
        tick();
      });
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Reset
      setDisplayedQ("");
      setDisplayedA("");
      setPhase("ready");

      await new Promise((r) => setTimeout(r, 800));
      if (cancelled) return;

      // Type question
      setPhase("typing-q");
      await typeText(convo.question, (v) => !cancelled && setDisplayedQ(v), 35);
      if (cancelled) return;

      // Thinking pause
      setPhase("thinking");
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;

      // Type answer
      setPhase("typing-a");
      await typeText(convo.answer, (v) => !cancelled && setDisplayedA(v), 18);
      if (cancelled) return;

      setPhase("done");

      // Wait then cycle to the next conversation
      await new Promise((r) => setTimeout(r, 6500));
      if (cancelled) return;
      setConvoIndex((prev) => (prev + 1) % CONVERSATIONS.length);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [convoIndex, convo.question, convo.answer, typeText]);

  return (
    <div className="p-6 md:p-8 font-mono text-[13px] md:text-sm leading-relaxed min-h-[200px]">
      {/* Status line */}
      <div className="flex items-center gap-2 mb-5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: phase === "done" ? "#34D399" : "#F59E0B",
            boxShadow:
              phase === "done"
                ? "0 0 8px rgba(52,211,153,0.5)"
                : "0 0 8px rgba(245,158,11,0.5)",
          }}
        />
        <span className="text-[11px] text-[var(--foreground-muted)] opacity-50 tracking-wider">
          {phase === "done" ? "Session complete" : "Session active"}
        </span>
      </div>

      {/* User question */}
      {(phase !== "ready") && (
        <div className="mb-4">
          <p>
            <span className="text-[var(--secondary)] font-semibold">you</span>
            <span className="opacity-20 mx-1.5">→</span>
            <span className="opacity-80">{displayedQ}</span>
            {phase === "typing-q" && (
              <span className="inline-block w-[2px] h-[14px] bg-[var(--secondary)] ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </div>
      )}

      {/* Thinking indicator */}
      {phase === "thinking" && (
        <div className="flex items-center gap-2 mb-4 py-2">
          <span className="text-[var(--accent)] font-semibold">professor</span>
          <span className="opacity-20 mx-0.5">→</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      )}

      {/* Professor answer */}
      {(phase === "typing-a" || phase === "done") && (
        <div>
          <p>
            <span className="text-[var(--accent)] font-semibold">professor</span>
            <span className="opacity-20 mx-1.5">→</span>
            <span className="opacity-80">{displayedA}</span>
            {phase === "typing-a" && (
              <span className="inline-block w-[2px] h-[14px] bg-[var(--accent)] ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </div>
      )}

      {/* Idle cursor */}
      {phase === "ready" && (
        <div className="flex items-center gap-0.5">
          <span className="w-[2px] h-4 bg-[var(--foreground-muted)] animate-pulse rounded-[1px]" />
        </div>
      )}
    </div>
  );
}
