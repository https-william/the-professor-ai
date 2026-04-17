import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Mode | The Professor",
  description: "Test your knowledge with AI-generated quizzes. Track your progress, identify weak areas, and ace your exams.",
  keywords: [
    "quiz",
    "test knowledge",
    "practice quiz",
    "exam prep",
    "AI quiz",
    "quiz mode",
    "The Professor",
  ],
  openGraph: {
    title: "Quiz Mode | The Professor AI",
    description: "Test your knowledge with AI-generated quizzes.",
    url: "https://theprofessor.xyz/quiz",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Quiz Mode",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
