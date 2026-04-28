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
import OnboardingModal from "@/components/features/OnboardingModal";
import FaviconSync from "@/components/ui/FaviconSync";
import GlobalToasts from "@/components/ui/GlobalToasts";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import GlassRefractionProvider from "@/components/ui/GlassRefractionProvider";
import SiteHeader from "@/components/ui/SiteHeader";
import DesktopTitleBar from "@/components/ui/DesktopTitleBar";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import DesktopSidebar from "@/components/navigation/DesktopSidebar";
import MobileNavigation from "@/components/navigation/MobileNavigation";
import PlatformShell from "@/components/platforms/PlatformShell";
import ConnectivityIndicator from "@/components/ui/ConnectivityIndicator";
import CommandPalette from "@/components/ui/CommandPalette";
import Footer from "@/components/ui/Footer";
import CookieBanner from "@/components/ui/CookieBanner";
import { Suspense } from "react";
import PWAUpdateNotifier from "@/components/providers/PWAUpdateNotifier";
import PWAInstallBanner from "@/components/ui/PWAInstallBanner";

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
    default: "The Professor | Advanced AI Study Companion",
    template: "%s | The Professor",
  },
  description: "Accelerate your learning with The Professor. Generate high-fidelity flashcards, quizzes, and academic roadmaps instantly using state-of-the-art AI.",
  manifest: "/site.webmanifest",
  keywords: ["AI Study Assistant", "Flashcard Generator", "AI Quiz Maker", "Academic Roadmap", "Study Tools", "The Professor"],
  authors: [{ name: "The Professor Team" }],
  openGraph: {
    title: "The Professor | Advanced AI Study Companion",
    description: "Accelerate your learning with The Professor. Generate high-fidelity flashcards, quizzes, and academic roadmaps instantly.",
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
    title: "The Professor | Advanced AI Study Companion",
    description: "Accelerate your learning with The Professor. Generate high-fidelity flashcards, quizzes, and academic roadmaps instantly.",
    images: ["/og-image.png"],
    creator: "@theprofessor",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
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
  description: "Advanced AI-powered study platform for generating flashcards, quizzes, and summaries.",
  sameAs: [
    "https://twitter.com/theprofessor",
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
    <html lang="en" className={`${outfit.variable} ${sourceSerif.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          as="style"
        />
        <link
          id="material-symbols-stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
          media="print"
          suppressHydrationWarning
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var link = document.getElementById('material-symbols-stylesheet');
                if (link) {
                  link.onload = function() { this.media = 'all'; };
                }
              })();
            `
          }}
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
      <body className="font-sans antialiased transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider>
          <PWAProvider>
            <UserProvider>
              <ReactQueryProvider>
                <ErrorBoundary>
                  <FaviconSync />
                  <GlassRefractionProvider />
                  <PlatformShell desktop={<DesktopTitleBar />} />
                  <PlatformShell desktop={<DesktopSidebar />} />
                  
                  <main className="platform-main-container relative h-screen flex flex-col overflow-hidden bg-[var(--background)]">
                      <SiteHeader showLogo={true} />
                      <div className="flex-1 overflow-y-auto scroll-smooth relative custom-scrollbar">
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--background)]"><div className="w-10 h-10 border-4 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" /></div>}>
                          {children}
                        </Suspense>
                        <Footer />
                      </div>
                  </main>
  
                  <PlatformShell mobile={<MobileNavigation />} />
                  <CookieBanner />
                  <OnboardingModal />
                  <ConnectivityIndicator />
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
