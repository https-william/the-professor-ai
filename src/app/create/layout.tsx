import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Study Materials | The Professor",
  description: "Generate flashcards, quizzes, summaries, and learning roadmaps instantly using AI. Upload your study materials and let The Professor create personalized study content.",
  keywords: [
    "create flashcards",
    "quiz generator",
    "AI study materials",
    "generate flashcards",
    "make quiz",
    "study content generator",
    "AI summarizer",
    "learning roadmap",
    "The Professor",
  ],
  openGraph: {
    title: "Create Study Materials | The Professor AI",
    description: "Generate flashcards, quizzes, summaries, and roadmaps instantly with AI.",
    url: "https://theprofessor.xyz/create",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Create Study Materials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Study Materials | The Professor",
    description: "Generate flashcards, quizzes, summaries, and roadmaps instantly with AI.",
    images: ["https://theprofessor.xyz/og-image.svg"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
