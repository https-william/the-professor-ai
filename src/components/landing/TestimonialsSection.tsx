"use client";

import { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "I used to spend hours making flashcards. The Professor generates them in seconds, and they're actually good. My organic chemistry deck saved my midterm.",
    name: "Maya T.",
    role: "Biology Student",
    initials: "MT",
    color: "#818cf8",
  },
  {
    quote: "The quiz duels with my study group changed everything. We compete to learn, not just to win. My retention went up 40% this semester.",
    name: "James K.",
    role: "Pre-Med Student",
    initials: "JK",
    color: "#f472b6",
  },
  {
    quote: "As a self-taught programmer, I needed structure. The learning roadmap feature gave me a clear path from beginner to job-ready.",
    name: "Alex R.",
    role: "Software Developer",
    initials: "AR",
    color: "#34d399",
  },
];

export default function TestimonialsSection() {
  const [isInView, setIsInView] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-20 px-5 md:px-6 z-10"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--foreground-muted)] mb-4">
            Student Stories
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">
            Learn from the best
          </h2>
        </div>

        <div className="relative">
          <div
            className="relative rounded-[clamp(1.5rem,3vw,2.5rem)] overflow-hidden"
            style={{
              background: "rgba(14,14,24,0.6)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(129,140,248,0.08), transparent 60%)",
              }}
            />

            <div className="relative p-8 sm:p-12 md:p-16 min-h-[280px] flex items-center">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.name}
                  className={`absolute inset-0 flex flex-col items-center justify-center text-center px-8 sm:px-12 md:px-20 transition-all duration-700 ${
                    index === activeIndex
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4 pointer-events-none"
                  }`}
                >
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        strokeWidth={2}
                        className="text-[var(--accent)] fill-[var(--accent)]"
                      />
                    ))}
                  </div>

                  <blockquote
                    className="text-[var(--foreground)] leading-relaxed mb-8"
                    style={{
                      fontSize: "clamp(1rem, 2vw, 1.25rem)",
                      maxWidth: "680px",
                    }}
                  >
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--background)] font-bold text-sm"
                      style={{ background: testimonial.color }}
                    >
                      {testimonial.initials}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[var(--foreground)] text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-[var(--foreground-muted)] text-xs">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 pb-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? "w-6 bg-[var(--accent)]"
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
