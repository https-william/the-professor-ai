import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Professor | Smart Study Secrets & Learning Science",
  description:
    "Evidence-based study techniques, academic insights, and the science of smart learning. Active recall, spaced repetition, the Feynman technique, and more — from The Professor.",
  keywords: [
    "study techniques",
    "active recall",
    "spaced repetition",
    "AI study tools",
    "learning science",
    "Feynman technique",
    "academic skills",
    "study tips",
    "The Professor",
    "Professor AI",
    "AI tutor",
    "exam preparation",
    "memory techniques",
    "learning strategies",
  ].join(", "),
  openGraph: {
    title: "The Professor | Smart Learning Hub",
    description:
      "Elite study techniques and the science of intuitive understanding. Transform how you study with smart AI tools.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_GB", "es_ES", "fr_FR"],
    url: "https://theprofessor.xyz/blog",
    siteName: "The Professor",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "The Professor Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Professor | Smart Learning Hub",
    description: "Elite study techniques and the science of intuitive understanding.",
    site: "@TheProfessorAI",
    creator: "@TheProfessorAI",
    images: ["https://theprofessor.xyz/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import BlogHeader from "@/components/blog/BlogHeader";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BlogHeader />
      {children}
    </>
  );
}
