import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Roadmap | The Professor",
  description: "Generate personalized learning roadmaps with AI. Get a structured study path from beginner to expert in any subject.",
  keywords: [
    "learning roadmap",
    "study path",
    "AI roadmap",
    "learning journey",
    "study plan",
    "curriculum",
    "The Professor",
  ],
  openGraph: {
    title: "Learning Roadmap | The Professor AI",
    description: "Generate personalized learning roadmaps with AI.",
    url: "https://theprofessor.xyz/roadmap",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Learning Roadmap",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
