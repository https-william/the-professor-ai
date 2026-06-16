"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import NavPill from "@/components/landing/NavPill";
import HeroSection from "@/components/landing/HeroSection";
import TheManifesto from "@/components/landing/TheManifesto";
import InteractiveDemo from "@/components/landing/InteractiveDemo";
import PainSection from "@/components/landing/PainSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQ";

export default function LandingPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user.isAuthenticated && !user.isLoading) {
      router.push("/dashboard");
    }
  }, [user.isAuthenticated, user.isLoading, router]);

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

  // Avoid layout flash when redirecting authenticated users
  if (user.isAuthenticated && !user.isLoading) {
    return null;
  }

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
    </>
  );
}
