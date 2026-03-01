import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import FrostedDock from "@/components/FrostedDock";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "The Professor | Cheat Codes for Your Degree",
  description: "Advanced AI study companion for students. Generate flashcards, quizzes, and summaries instantly.",
  manifest: "/manifest.json",
  keywords: ["AI", "study", "flashcards", "education", "tutor", "exam prep"],
  authors: [{ name: "The Professor" }],
  creator: "The Professor",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Professor AI",
  },
  openGraph: {
    title: "The Professor | Cheat Codes for Your Degree",
    description: "Your personal AI-powered study companion.",
    type: "website",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F59E0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased transition-colors duration-300">
        <ThemeProvider>
          <UserProvider>
            {children}
            <FrostedDock />
            <ServiceWorkerRegistrar />
            <Analytics />
            <SpeedInsights />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

