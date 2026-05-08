import type { Metadata, Viewport } from "next";
import { Outfit, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PWAProvider } from "@/context/PWAContext";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FaviconSync from "@/components/ui/FaviconSync";
import GlobalToasts from "@/components/ui/GlobalToasts";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import GlassRefractionProvider from "@/components/ui/GlassRefractionProvider";
import PlatformLoader from "@/components/platforms/PlatformLoader";
import PlatformShell from "@/components/platforms/PlatformShell";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ConnectivityIndicator from "@/components/ui/ConnectivityIndicator";
import SyncIndicator from "@/components/ui/SyncIndicator";
import CommandPalette from "@/components/ui/CommandPalette";
import Footer from "@/components/ui/Footer";
import CookieBanner from "@/components/ui/CookieBanner";
import { Suspense } from "react";
import PWAUpdateNotifier from "@/components/providers/PWAUpdateNotifier";
import PWAInstallBanner from "@/components/ui/PWAInstallBanner";
import SiteHeader from "@/components/ui/SiteHeader";
import AmbientOrbs from "@/components/ui/AmbientOrbs";

/* ═══ Typography Stack ═══
   Outfit → Geometric sans. Used for headings, UI chrome, user prompts.
             Closest free alternative to Styrene B (Claude aesthetic).
   Source Serif 4 → Editorial serif. Used for body text, AI responses, reading.
                     Closest free alternative to Tiempos Text.
   ═══════════════════════ */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  adjustFontFallback: true,
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  style: ["normal", "italic"],
  adjustFontFallback: true,
});

const SITE_URL = "https://theprofessor.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "The Professor | Elite AI Study Strategy",
    template: "%s | The Professor",
  },
  description: "Experience the exam before it starts. The Professor uses strategic AI retrieval to build your intuition from any syllabus, turning dense materials into intuitive mastery.",
  manifest: "/site.webmanifest",
  keywords: ["The Professor", "Professor AI", "AI Study Assistant", "Flashcard Generator", "AI Quiz Maker", "Strategic Learning", "Exam Simulation"],
  authors: [{ name: "The Professor Team" }],
  openGraph: {
    title: "The Professor | Elite AI Study Strategy",
    description: "Experience the exam before it starts. Master any syllabus with strategic AI retrieval and intuitive mastery.",
    url: SITE_URL,
    siteName: "The Professor",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Professor AI Study Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Professor | Elite AI Study Strategy",
    description: "Experience the exam before it starts. Master any syllabus with strategic AI retrieval.",
    images: ["/og-image.png"],
    creator: "@TheProfessorAI",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicons/dark/favicon-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/favicons/dark/favicon-16x16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/favicons/dark/apple-touch-icon.png", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "The Professor",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon-32x32.png`,
  description: "Elite AI-powered study strategist for generating flashcards, quizzes, and strategic summaries.",
  sameAs: [
    "https://twitter.com/TheProfessorAI",
    "https://github.com/the-professor-ai"
  ]
};

export const viewport: Viewport = {
  themeColor: "#08080E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${sourceSerif.variable} w-full h-full`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          as="style"
        />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        <link
          id="material-symbols-stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
          suppressHydrationWarning
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var updatePlatformAttribute = function() {
                  var isNative = window.location.protocol === 'tauri:' || 
                                 window.location.protocol === 'asset:' || 
                                 window.location.hostname.includes('tauri') ||
                                 (window.location.hostname === 'localhost' && window.location.port === '');
                  
                  var ua = navigator.userAgent.toLowerCase();
                  var isMobile = ua.includes("android") || ua.includes("iphone") || ua.includes("ipad");
                  
                  var html = document.documentElement;
                  if (isNative) {
                    html.setAttribute('data-platform', isMobile ? 'mobile' : 'desktop');
                    html.setAttribute('data-native', 'true');
                  } else {
                    html.setAttribute('data-platform', isMobile ? 'mobile' : 'web');
                  }

                  if (isMobile) {
                     html.classList.add('is-mobile');
                  }
                };
                updatePlatformAttribute();
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased transition-colors duration-300 w-full h-full m-0 p-0" suppressHydrationWarning>
        <ThemeProvider>
          <PWAProvider>
            <UserProvider>
              <ReactQueryProvider>
                <ErrorBoundary>
                  <FaviconSync />

                  <GlassRefractionProvider />
                  <PlatformLoader />
                  
                  <SiteHeader showLogo={true} />
                  <main className="platform-main-container relative h-full w-full flex flex-col">
                      <div id="main-scroll-container" className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth relative custom-scrollbar w-full h-full z-[1] flex flex-col">
                        <AmbientOrbs />
                        <div className="flex-1 flex flex-col">
                          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--background)]"><div className="w-10 h-10 border-4 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" /></div>}>
                             {children}
                          </Suspense>
                        </div>
                        <Footer />
                      </div>
                  </main>
  
                  {/* Mobile nav handled by PlatformLoader */}
                  <CookieBanner />
                  <ConnectivityIndicator />
                  <SyncIndicator />
                  <GlobalToasts />
                  <CommandPalette />
                  <PWAUpdateNotifier />
                  <PWAInstallBanner />
                  <ServiceWorkerRegistrar />
                  <Analytics />
                  <SpeedInsights />
                </ErrorBoundary>
              </ReactQueryProvider>
            </UserProvider>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
