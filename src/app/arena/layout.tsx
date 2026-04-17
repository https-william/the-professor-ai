import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Arena | The Professor",
  description: "Challenge other students to 1v1 quiz duels. Compete in real-time, climb the leaderboard, and prove you're the best learner.",
  keywords: [
    "quiz duels",
    "1v1 quiz",
    "competitive quiz",
    "quiz arena",
    "student competition",
    "exam competition",
    "leaderboard",
    "The Professor",
  ],
  openGraph: {
    title: "Quiz Arena | The Professor AI",
    description: "Challenge other students to 1v1 quiz duels.",
    url: "https://theprofessor.xyz/arena",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Quiz Arena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiz Arena | The Professor",
    description: "Challenge other students to 1v1 quiz duels.",
    images: ["https://theprofessor.xyz/og-image.svg"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ArenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
