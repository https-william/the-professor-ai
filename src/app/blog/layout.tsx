import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Professor's Blog — Study Techniques, Learning Science & AI in Education",
  description:
    "Evidence-based study techniques, academic insights, and the science of learning. Active recall, spaced repetition, the Feynman technique, and more — from The Professor AI study platform.",
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
    "AI tutor",
    "exam preparation",
    "memory techniques",
    "learning strategies",
  ].join(", "),
  openGraph: {
    title: "The Professor's Blog | Study Tips & Learning Science",
    description:
      "Evidence-based study techniques and the science of learning. Transform how you study with AI-powered tools.",
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
        alt: "The Professor Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Professor's Blog | Study Tips & Learning Science",
    description: "Evidence-based study techniques and the science of learning.",
    site: "@TheProfessorAI",
    creator: "@TheProfessorAI",
    images: ["https://theprofessor.xyz/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
