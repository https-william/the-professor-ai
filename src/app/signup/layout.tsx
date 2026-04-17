import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | The Professor",
  description: "Create your free The Professor account. Start generating flashcards, quizzes, and study roadmaps instantly. No credit card required.",
  keywords: [
    "sign up",
    "register",
    "create account",
    "The Professor signup",
    "free AI study",
    "student registration",
  ],
  openGraph: {
    title: "Sign Up | The Professor AI",
    description: "Create your free account and start learning with AI.",
    url: "https://theprofessor.xyz/signup",
    type: "website",
    images: [
      {
        url: "https://theprofessor.xyz/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Sign Up",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
