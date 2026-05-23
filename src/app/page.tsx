"use client";

import React, { useEffect } from "react";
import NavPill from "@/components/landing/NavPill";
import HeroSection from "@/components/landing/HeroSection";
import TheManifesto from "@/components/landing/TheManifesto";
import InteractiveDemo from "@/components/landing/InteractiveDemo";
import PainSection from "@/components/landing/PainSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";

export default function LandingPage() {
  useEffect(() => {
    // Intersection Observer for scroll-reveal animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".animate-up").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <NavPill />
      <HeroSection />
      <PainSection />
      <TheManifesto />
      <HowItWorksSection />
      <InteractiveDemo />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
