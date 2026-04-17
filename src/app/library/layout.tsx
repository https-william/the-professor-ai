import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Library | The Professor",
  description: "Access your personal collection of AI-generated flashcards, quizzes, summaries, and learning roadmaps. All your study materials in one place.",
  keywords: [
    "my library",
    "study materials",
    "flashcard library",
    "quiz collection",
    "saved flashcards",
    "AI study content",
    "learning library",
    "The Professor",
  ],
  openGraph: {
    title: "My Library | The Professor AI",
    description: "Your personal collection of AI-generated study materials.",
    url: "https://theprofessor.xyz/library",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "My Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Library | The Professor",
    description: "Your personal collection of AI-generated study materials.",
    images: ["https://theprofessor.xyz/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
