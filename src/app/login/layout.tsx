import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | The Professor",
  description: "Sign in to your The Professor account to access your AI study companion. Generate flashcards, quizzes, and roadmaps instantly.",
  keywords: [
    "login",
    "sign in",
    "The Professor login",
    "AI study login",
    "student account",
  ],
  openGraph: {
    title: "Login | The Professor AI",
    description: "Sign in to access your AI study companion.",
    url: "https://theprofessor.xyz/login",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Login",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
