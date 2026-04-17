import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flashcards | The Professor",
  description: "Review your AI-generated flashcards with spaced repetition. Master any subject with interactive study cards.",
  keywords: [
    "flashcards",
    "study cards",
    "spaced repetition",
    "flashcard review",
    "AI flashcards",
    "The Professor",
  ],
  openGraph: {
    title: "Flashcards | The Professor AI",
    description: "Review your AI-generated flashcards with spaced repetition.",
    url: "https://theprofessor.xyz/flashcards",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Flashcards",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
