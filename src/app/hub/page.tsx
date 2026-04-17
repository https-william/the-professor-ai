import type { Metadata } from "next";
import HubClient from "./HubClient";

export const metadata: Metadata = {
  title: "Academic Arena | The Professor Hub",
  description: "Challenge your peers, climb the leaderboard, and master your subjects in the The Professor's competitive academic hub.",
  openGraph: {
    title: "Academic Arena | The Professor Hub",
    description: "Real-time academic competition and leaderboard. See where you stand among your peers.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "The Professor Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Academic Arena | The Professor Hub",
    description: "Real-time academic competition and leaderboard.",
    images: ["/logo.png"],
  },
};

export default function HubPage() {
  return <HubClient />;
}
