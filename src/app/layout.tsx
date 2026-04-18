import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Dock from "@/components/ui/Dock";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import OnboardingModal from "@/components/features/OnboardingModal";
import GlobalToasts from "@/components/ui/GlobalToasts";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import GlassRefractionProvider from "@/components/ui/GlassRefractionProvider";
import SiteHeader from "@/components/ui/SiteHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const SITE_URL = "https://theprofessor.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Professor | Advanced AI Study Companion",
    template: "%s | The Professor",
  },
  description: "Accelerate your learning with The Professor. Generate high-fidelity flashcards, quizzes, and academic roadmaps instantly using state-of-the-art AI.",
  manifest: "/manifest.json",
  keywords: [
    "AI Study Assistant",
    "Active Recall AI", 
    "Study Roadmap Generator",
    "Flashcard AI",
    "Academic Quiz Bot",
    "The Professor Study",
    "AI Tutor",
    "Online Learning",
    "Exam Prep",
    "Spaced Repetition",
    "Smart Flashcards",
    "Quiz Maker",
    "Study Companion",
    "AI Education",
    "Student Tools",
    "Academic Assistant",
    "Exam Cram",
    "Learning Platform",
    "AI Flashcards",
    "Quiz Generation",
  ],
  authors: [{ name: "The Professor" }],
  creator: "The Professor",
  publisher: "The Professor Academy",
  category: "education",
  classification: "Web Application",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "en-GB": "https://theprofessor.xyz/en-gb",
      "en-AU": "https://theprofessor.xyz/en-au",
      "en-IN": "https://theprofessor.xyz/en-in",
      "es-ES": "https://theprofessor.xyz/es",
      "fr-FR": "https://theprofessor.xyz/fr",
      "de-DE": "https://theprofessor.xyz/de",
      "ja-JP": "https://theprofessor.xyz/ja",
      "pt-BR": "https://theprofessor.xyz/pt-br",
      "hi-IN": "https://theprofessor.xyz/hi",
      "zh-CN": "https://theprofessor.xyz/zh",
    },
  },
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
    title: "The Professor | Advanced AI Study Companion",
    description: "Your personal AI-powered study companion. Generate flashcards, quizzes, summaries and roadmaps instantly. Cheat codes for your degree.",
    url: SITE_URL,
    siteName: "The Professor",
    locale: "en_US",
    alternateLocale: ["en_GB", "es_ES", "fr_FR", "de_DE", "ja_JP", "pt_BR", "hi_IN", "zh_CN"],
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "The Professor - AI Study Companion",
        type: "image/svg+xml",
      },
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "The Professor Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Professor | Advanced AI Study Companion",
    description: "Your personal AI-powered study companion. Generate flashcards, quizzes, summaries and roadmaps instantly.",
    site: "@TheProfessorAI",
    creator: "@TheProfessorAI",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        {/* Font Fallback for Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
        {/* Native API / Auth Bridge — Intercepts relative /api calls in native wrappers */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const PRODUCTION_URL = "https://theprofessor.xyz";
                const isNative = window.location.protocol === 'tauri:' || 
                               window.location.protocol === 'asset:' || 
                               window.location.hostname.includes('tauri') ||
                               (window.location.hostname === 'localhost' && window.location.port === '');
                
                if (isNative) {
                  const originalFetch = window.fetch;
                  window.fetch = function(input, init) {
                    if (typeof input === 'string' && input.startsWith('/api/')) {
                      input = PRODUCTION_URL + input;
                    }
                    return originalFetch(input, init);
                  };
                  console.log('Native Bridge Active: Redirecting API calls to ' + PRODUCTION_URL);
                }
              })();
            `,
          }}
        />

        {/* Old browser detection — redirect to static fallback */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof CSS === 'undefined' || !CSS.supports || !CSS.supports('width', 'clamp(1px,2vw,3px)')) {
                  if (window.location.pathname.indexOf('/fallback') === -1) {
                    window.location.replace('/fallback.html');
                  }
                }
              } catch(e) {
                window.location.replace('/fallback.html');
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased transition-colors duration-300" suppressHydrationWarning>
        <ReactQueryProvider>
          <ThemeProvider>
            <UserProvider>
              <GlassRefractionProvider />
              <SiteHeader showLogo={true} />
              {children}
              <OnboardingModal />
              <GlobalToasts />
              <ServiceWorkerRegistrar />
              <Analytics />
              <SpeedInsights />
            </UserProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

