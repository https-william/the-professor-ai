import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import FrostedDock from "@/components/FrostedDock";

export const metadata: Metadata = {
  title: "The Professor | AI Study Companion",
  description: "Your personal AI-powered study companion. Upload your syllabus, generate flashcards, predict exam questions, and master any subject.",
  keywords: ["AI", "study", "flashcards", "education", "tutor", "exam prep"],
  authors: [{ name: "The Professor" }],
  creator: "The Professor",
  openGraph: {
    title: "The Professor | AI Study Companion",
    description: "Your personal AI-powered study companion.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        {/* Preload fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
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
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

