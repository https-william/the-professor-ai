import type { Metadata, Viewport } from "next";
// Fonts loaded via stylesheet in head to prevent build-time network timeouts
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
import ProfessorTour from "@/components/features/ProfessorTour";
import SiteHeader from "@/components/ui/SiteHeader";
import NavigationLoader from "@/components/ui/NavigationLoader";
import MainLayoutWrapper from "@/components/ui/MainLayoutWrapper";
import MotionConfigProvider from "@/components/providers/MotionConfigProvider";
import ThemePresetManager from "@/components/ui/ThemePresetManager";

/* ═══ Typography Stack ═══
   Outfit → Geometric sans. Used for headings, UI chrome, user prompts.
             Closest free alternative to Styrene B (Claude aesthetic).
   Source Serif 4 → Editorial serif. Used for body text, AI responses, reading.
                     Closest free alternative to Tiempos Text.
   ═══════════════════════ */
const outfit = { variable: "--font-outfit" };
const sourceSerif = { variable: "--font-source-serif" };
const jetbrainsMono = { variable: "--font-mono" };

const SITE_URL = "https://www.theprofessor.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  title: {
    default: "The Professor AI | Your notes. Just the good parts.",
    template: "%s | The Professor",
  },
  description: "Stop the study grind. The Professor AI turns your overwhelming notes into simple study guides and quizzes instantly. Get your time back and actually understand your material.",
  manifest: "/site.webmanifest",
  keywords: ["The Professor", "Professor AI", "Study Less", "AI Study Tool", "Flashcard Generator", "AI Quiz Maker", "JAMB 2026", "WAEC 2026", "Simple Study Guides"],
  verification: {
    google: "NoGNvRcrMhu-QIt_DV2RJM-xKqETasp4Fvpp7-O6mmI",
  },
  authors: [{ name: "The Professor Team" }],
  openGraph: {
    title: "The Professor AI | Your notes. Just the good parts.",
    description: "Uni is a lot, we get it. We turn your notes into simple study guides so you can actually enjoy your day.",
    url: SITE_URL,
    siteName: "The Professor AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Professor AI - The End of Traditional Studying",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Professor AI | Your notes. Just the good parts.",
    description: "Experience your notes, but faster. Get your time back with AI-powered study guides.",
    images: ["/og-image.png"],
    creator: "@TheProfessorAI",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo.svg",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Professor",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon-32x32.png`,
    "description": "Elite AI-powered study mentor for generating flashcards, quizzes, and smart summaries.",
    "sameAs": [
      "https://twitter.com/TheProfessorAI",
      "https://github.com/the-professor-ai"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "The Professor AI",
    "url": SITE_URL,
    "description": "Stop the study grind. The Professor AI turns your overwhelming notes into simple study guides, active recall flashcards, practice quizzes, and revision roadmaps instantly.",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "Students, Exam Candidates, Academics"
    }
  }
];

const aiContextData = {
  brandName: "The Professor AI",
  slogan: "Your notes. Just the good parts.",
  valueProposition: "Stop the study grind. Drop your notes and get your time back with instant smart summaries, practice quizzes, memory cards, and revision roadmaps.",
  targetAudience: "University students, high school students, WAEC/JAMB candidates, and anyone experiencing study fatigue.",
  primaryPainPointsSolved: [
    "Study fatigue and information overload",
    "Wasting hours summarizing dry textbook chapters and lecture slides",
    "Lack of active practice materials before exams",
    "Sleep deprivation due to late-night cram sessions"
  ],
  coreFeatures: [
    {
      name: "Deep Summary",
      description: "Simple, straightforward breakdowns of your lecture notes."
    },
    {
      name: "Memory Cards",
      description: "Active recall flashcards featuring ELI5 (Explain Like I'm 5) metaphors."
    },
    {
      name: "Practice Quiz",
      description: "Tutor-grade questions with step-by-step reasoning and detailed answers."
    },
    {
      name: "Revision Roadmap",
      description: "Actionable roadmap plans prioritizing high-impact topics."
    }
  ],
  brandVoiceGuidelines: {
    tone: "Conversational, approachable, witty, and reassuring.",
    style: "Simple, direct, non-corporate, coffee-shop mentor vibe.",
    keywordsToPrefer: ["simple", "easy", "smart", "pass", "get your time back", "just the good parts", "ace"],
    avoidWords: ["aggressive", "mastery", "strategic", "offensive", "dominance", "crush", "hack"]
  },
  socialProof: [
    { name: "Tunde", outcome: "Saved hours reviewing lecture slides and aced his exams." },
    { name: "Amaka", outcome: "Got her sleep back instead of pulling all-nighters." },
    { name: "Ifeanyi", outcome: "Skipped the study fluff and went into the test prepared." }
  ],
  pricingModel: "Free to get started. High-conversion weekly sprint options available."
};

export const viewport: Viewport = {
  themeColor: "#08080E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} w-full min-h-screen`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Urbanist:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap"
          rel="stylesheet"
          suppressHydrationWarning
        />
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
          type="application/json"
          id="brand-ad-context"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aiContextData) }}
        />
        <script src="https://telegram.org/js/telegram-web-app.js?56" defer />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/core-js-bundle/3.38.1/minified.js" noModule suppressHydrationWarning />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Polyfills for legacy engines (e.g. Safari 12 / iOS 12 on iPod Touch 6th Gen)
                if (typeof globalThis === "undefined") {
                  window.globalThis = window;
                }
                if (typeof Promise.allSettled === "undefined") {
                  Promise.allSettled = function(promises) {
                    return Promise.all(
                      promises.map(function(p) {
                        return Promise.resolve(p).then(
                          function(val) { return { status: "fulfilled", value: val }; },
                          function(err) { return { status: "rejected", reason: err }; }
                        );
                      })
                    );
                  };
                }
                if (typeof window.ResizeObserver === "undefined") {
                  window.ResizeObserver = function() {
                    return {
                      observe: function() {},
                      unobserve: function() {},
                      disconnect: function() {}
                    };
                  };
                }
                if (typeof window.IntersectionObserver === "undefined") {
                  window.IntersectionObserver = function(callback) {
                    return {
                      observe: function(element) {
                        if (typeof callback === 'function') {
                          setTimeout(function() {
                            callback([{ target: element, isIntersecting: true }]);
                          }, 0);
                        }
                      },
                      unobserve: function() {},
                      disconnect: function() {}
                    };
                  };
                }
                if (typeof crypto === "undefined") {
                  window.crypto = {};
                }
                if (typeof crypto.randomUUID === "undefined") {
                  window.crypto.randomUUID = function() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    });
                  };
                }
                if (typeof Object.fromEntries === "undefined") {
                  Object.fromEntries = function(entries) {
                    var obj = {};
                    var it = entries[Symbol.iterator] ? entries[Symbol.iterator]() : null;
                    if (it) {
                      var step;
                      while (!(step = it.next()).done) {
                        var pair = step.value;
                        obj[pair[0]] = pair[1];
                      }
                    } else if (Array.isArray(entries)) {
                      for (var i = 0; i < entries.length; i++) {
                        var pair = entries[i];
                        obj[pair[0]] = pair[1];
                      }
                    }
                    return obj;
                  };
                }
                if (!String.prototype.matchAll) {
                  String.prototype.matchAll = function(rx) {
                    if (!rx.global) {
                      throw new TypeError('String.prototype.matchAll called with a non-global RegExp');
                    }
                    var str = this;
                    var res = [];
                    var m;
                    while ((m = rx.exec(str)) !== null) {
                      res.push(m);
                    }
                    var index = 0;
                    return {
                      next: function() {
                        return index < res.length
                          ? { value: res[index++], done: false }
                          : { value: undefined, done: true };
                      }
                    };
                  };
                }

                // Array.prototype.at — Safari 15.3 and below
                if (!Array.prototype.at) {
                  Array.prototype.at = function(idx) {
                    var n = Math.trunc(idx) || 0;
                    if (n < 0) n += this.length;
                    if (n < 0 || n >= this.length) return undefined;
                    return this[n];
                  };
                }

                // structuredClone — Safari 15.3 and below
                if (typeof structuredClone === 'undefined') {
                  window.structuredClone = function(obj) {
                    try { return JSON.parse(JSON.stringify(obj)); }
                    catch(e) { return obj; }
                  };
                }

                // Object.hasOwn — Safari 15.3 and below
                if (!Object.hasOwn) {
                  Object.hasOwn = function(obj, prop) {
                    return Object.prototype.hasOwnProperty.call(obj, prop);
                  };
                }

                // Legacy browser redirect — if browser can't handle modern JS, route to specific fallback pages
                // Test for optional chaining + nullish coalescing (ES2020 minimum)
                try {
                  eval('({}?.x ?? 0)');
                } catch(e) {
                  var path = window.location.pathname;
                  if (path === '/login' || path === '/login/') {
                    window.location.replace('/fallback-login.html');
                  } else if (path === '/signup' || path === '/signup/') {
                    window.location.replace('/fallback-signup.html');
                  } else if (path === '/' || path === '/index.html') {
                    window.location.replace('/fallback.html');
                  } else if (path !== '/legacy/index.html' && path !== '/legacy') {
                    window.location.replace('/legacy/index.html');
                  }
                }

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
                
                var initTheme = function() {
                  try {
                    var theme = localStorage.getItem('theme');
                    var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                    if (!theme) theme = 'system';
                    
                    var resolved = theme;
                    if (theme === 'system') resolved = supportDarkMode ? 'dark' : 'light';
                    
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(resolved);
                  } catch (e) {}
                };

                var initTelegram = function() {
                  try {
                    if (window.location.search.includes('tgWebApp') || window.location.hash.includes('tgWebApp') || (window.Telegram && window.Telegram.WebApp)) {
                      document.documentElement.classList.add('telegram-app');
                    }
                  } catch (e) {}
                };

                updatePlatformAttribute();
                initTheme();
                initTelegram();
              })();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          ::highlight(search-hit) {
            background-color: rgba(229, 169, 60, 0.35);
            color: #FFFFFF;
            text-shadow: 0 0 8px rgba(229, 169, 60, 0.5);
          }
          ::highlight(citation-ref) {
            background-color: rgba(74, 124, 245, 0.25);
            color: #FFFFFF;
            border-bottom: 2px solid var(--blue);
          }
        ` }} />
      </head>
      <body className="font-sans antialiased w-full min-h-screen m-0 p-0 flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <PWAProvider>
            <UserProvider>
              <ReactQueryProvider>
                <ErrorBoundary>
                  <MotionConfigProvider>
                    <FaviconSync />
                    <ThemePresetManager />

                    <GlassRefractionProvider />
                    <PlatformLoader />
                    
                    <SiteHeader showLogo={true} />
                    <NavigationLoader />
                <MainLayoutWrapper>
                  
                  <div id="main-scroll-container" className="flex-1 relative w-full z-[1] flex flex-col">
                    <div className="flex-1 flex flex-col relative z-[10]">
                      {children}
                    </div>
                    <Footer />
                  </div>
                </MainLayoutWrapper>
    
                    {/* Mobile nav handled by PlatformLoader */}
                    <CookieBanner />
                    <ConnectivityIndicator />
                    <SyncIndicator />
                    <GlobalToasts />
                    <CommandPalette />
                    <PWAUpdateNotifier />
                    <PWAInstallBanner />
                    <ProfessorTour />
                    <ServiceWorkerRegistrar />
                    <Analytics />
                    <SpeedInsights />
                  </MotionConfigProvider>
                </ErrorBoundary>
              </ReactQueryProvider>
            </UserProvider>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
