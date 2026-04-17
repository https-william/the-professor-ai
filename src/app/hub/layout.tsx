import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Hub | The Professor",
  description: "Join collaborative study rooms, compete in quiz duels, and connect with other learners. The ultimate study community powered by AI.",
  keywords: [
    "study hub",
    "study rooms",
    "collaborative learning",
    "quiz duels",
    "study community",
    "online study group",
    "competitive learning",
    "The Professor",
  ],
  openGraph: {
    title: "Study Hub | The Professor AI",
    description: "Join collaborative study rooms and compete in quiz duels.",
    url: "https://theprofessor.xyz/hub",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Study Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Study Hub | The Professor",
    description: "Join collaborative study rooms and compete in quiz duels.",
    images: ["https://theprofessor.xyz/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
