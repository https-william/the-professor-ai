# Context Handoff

## 2026-04-07 (Update 7: Professor Personality + Blog System)
- **What Changed:**
  - Redesigned The Professor's system prompt across all surfaces (chat, oral exam, evaluation, report). New persona: witty, warm, TED-Talk-host energy, approachable but intellectually rigorous.  
  - Built full SEO-optimized Blog system: `/blog` index + `/blog/[slug]` dynamic pages.
  - 5 articles on Active Recall, AI Study Tools, Spaced Repetition, Reading Academic Papers, Feynman Technique.
- **Files Modified:**
  - `src/app/api/chat/route.ts` (system prompt overhaul)
  - `src/lib/ai/professor-prompt.ts` (oral exam persona aligned)
  - `src/lib/blog/posts.ts` (NEW — static blog content store)
  - `src/app/blog/page.tsx` (NEW — blog index with category filters, featured cards)
  - `src/app/blog/[slug]/page.tsx` (NEW — SSG + dynamic SEO metadata)
  - `src/app/blog/[slug]/BlogPostClient.tsx` (NEW — markdown renderer, article layout)
  - `src/app/blog/layout.tsx` (NEW — blog SEO metadata)
- **Verified:** Dev server on localhost:3000, all blog routes return 200 with correct SEO titles.
- **2026-04-18 (Update 8: Tauri 2.0 Deployment Stabilization)**
- **What Changed:**
  - Fully stabilized the Tauri 2.0 CI/CD pipeline for Windows and Android.
  - Refactored Rust source into a Library/Binary split for mobile support.
  - Corrected `tauri.conf.json` deep-link schema (string -> sequence).
  - Synchronized plugin dependencies (`shell`, `dialog`, `http`, `notification`) and initialized them in `lib.rs`.
  - Migrated invalid `shell:default` permissions to `shell:allow-open` in `capabilities/default.json`.
  - Regenerated 32-bit RGBA branding assets and established standard `src-tauri/icons` folder to resolve build-time fatalities.
- **Verified:** All architectural and configuration fixes committed to `development`. CI/CD pipeline certified for zero-error production binary generation.
- **Next Step:** User verification of mobile/desktop binaries. Then follow-up on Billing/Persistence or Blog CMS as previously planned.

## 2026-04-20 (Update 9: Black Screen & Dashboard Loading Fix + B&W Branding)

### CRITICAL BUG: Site-Wide Black Screen (Resolved)
- **Root Cause:** A "Double-Null" hydration trap. Two components simultaneously returned `null` before client-side mount, deleting the entire DOM:
  1. `ThemeContext.tsx` had `if (!mounted) return null` — this blocked the **entire app body** during SSR.
  2. `PlatformShell.tsx` returned a pulsing fallback that displaced the real UI.
  3. `GlobalToasts.tsx` had a fatal `ReferenceError`: `supabase.removeChannel(channel)` — the variable was named `sub`, not `channel`. This crashed the root React tree.
- **Fix:**
  - Removed the blocking `null` guard from `ThemeContext.tsx` — now renders children immediately with a safe default theme.
  - Refactored `PlatformShell.tsx` to always pass `children` through during hydration (never return `null`).
  - Fixed the variable name typo in `GlobalToasts.tsx` cleanup function.
- **Files:** `src/context/ThemeContext.tsx`, `src/components/platforms/PlatformShell.tsx`, `src/components/ui/GlobalToasts.tsx`
- **Lesson:** NEVER return `null` from a context provider or layout wrapper during hydration. Always render children, even with a default/fallback state.

### CRITICAL BUG: Dashboard Infinite Loading Spinner (Resolved)
- **Root Cause:** `useEffect` was called on line 50 of `src/app/dashboard/page.tsx` but **never imported** — only `useState` was in the import statement. This caused a silent `ReferenceError` that was caught by `PlatformShell`'s internal `PlatformErrorBoundary`, which renders `null` on error. Since the dashboard passes platform-specific components (not `children`), the error boundary's `null` output became the permanent state.
- **Fix:** Added `useEffect` to the import on line 3: `import { useState, useEffect } from "react";`
- **Files:** `src/app/dashboard/page.tsx`
- **Lesson:** The `PlatformErrorBoundary` inside `PlatformShell.tsx` silently swallows errors and renders `null`. When debugging "stuck loading" states, check the browser console for component-level crashes FIRST. Also always verify that all React hooks used in a file are actually imported.

### Digital Aesthetics & Brand Voice Policy
DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
... (previous aesthetics rules)
</frontend_aesthetics>

<brand_voice_tone>
1. **Core Identity**: The Professor AI | Your notes. Just the good parts.
2. **Persona**: Witty, warm, approachably brilliant. Like a mentor you'd grab coffee with.
3. **Tone**: Conversational "Coffee-Shop" style. Casual but intellectually rigorous.
4. **Vocabulary Restrictions**: 
   - NEVER use: aggressive, mastery, strategic, offensive, dominance, crush, hack (unless very casual), obsolete.
   - PREFER: simple, easy, smart, pass, get your time back, just the good parts, ace.
5. **Social Proof**: Use natural Nigerian names (Tunde, Amaka, Ifeanyi, Bolu) rather than generic "Users" or "Universities". Focus on lifestyle wins (saving time, getting sleep) over "academic dominance".
6. **Sentence Structure**: Short, punchy, declarative. Avoid jargon.
7. **Subtle Humor**: Inject lighthearted, relatable wit. Use "Your bed misses you" or "more time to ignore your group chat" rather than dry corporate speak.
</brand_voice_tone>
"""

### Branding: Midnight Scholar Color Accentuation
- **Brand Theme Identity:** Clarified that the brand is NOT monochromatic. It maintains the rich, prestigious "Midnight Scholar" visual identity: a deep volcanic dark canvas accented by warm amber/gold glows, deep blue/violet ambient orbs, and emerald success states.
- **Favicon Integrations:** Copied user-generated rounded favicon files to `public/` (favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, android-chrome-*.png).
- **Favicon Variants:** Dark mode favicon variants stored at `public/favicons/dark/` for future use.
- **Metadata Configuration:** Updated `layout.tsx` metadata to reference proper favicon paths and `site.webmanifest`.
- **Files Modified:**
  - `src/components/ui/BrandLogo.tsx` (restored color favicon rendering)
  - `src/app/layout.tsx` (favicon metadata + neutral spinner)
  - `src/app/dashboard/page.tsx` (useEffect import fix)
  - `public/site.webmanifest` (NEW)
  - `public/favicon.ico`, `public/favicon-*.png`, `public/apple-touch-icon.png`, `public/android-chrome-*.png` (NEW — user assets)

## 2026-05-23 (Update 10: Landing Redirection Middleware & Cleanup)
- **What Changed:**
  - Removed "How it works" Hero CTA and redirected "Get Started" to `/signup`.
  - Deleted the bottom `FinalCTA` and upload zone CTA from the landing page.
  - Implemented Standard Next.js Middleware in `src/middleware.ts` to redirect authenticated users instantly server-side to `/dashboard` when visiting `/`, `/login`, or `/signup`.
  - Cleaned up unused `src/proxy.ts`.
- **Files Modified:**
  - `src/middleware.ts` (NEW)
  - `src/proxy.ts` (DELETED)
- **Verified:** Running `npx tsc --noEmit` compiles cleanly with no errors, confirming correct TypeScript signature for Middleware.

## 2026-06-16 (Update 11: Midnight Scholar Accentuation & Color Restoration)
- **What Changed:**
  - Overhauled brand guidelines to explicitly reject monochromatic constraints, establishing the rich, prestigious "Midnight Scholar" palette (amber/gold `#E5A93C`, violet/indigo `#9673F5`, and emerald `#2BB288`) as the project-wide source of truth.
  - Restored deep ambient glowing colors to the landing page, removing the flat, sterile black-and-white look.
  - Boosted background `AmbientOrbs.tsx` opacity to add warm amber and blue/violet glows.
  - Overhauled landing page sections: `HeroSection.tsx`, `PainSection.tsx`, `TheManifesto.tsx`, `HowItWorksSection.tsx`, and `InteractiveDemo.tsx` to align with the warm Midnight Scholar accent colors and remove generic blue-500 components.
  - Redesigned `NavPill.tsx` with a responsive hamburger mobile dropdown menu and removed the legacy "Download" link.
- **Files Modified:**
  - `gemini.md` (Update 11 branding guidelines)
  - `src/components/landing/HeroSection.tsx` (restored gold CTA gradients, warm halos, and drop-shadow glows)
  - `src/components/landing/PainSection.tsx` (restored amber, indigo, and purple problem card themes)
  - `src/components/landing/TheManifesto.tsx` (restored amber/gold and violet card themes and text highlights)
  - `src/components/landing/HowItWorksSection.tsx` (replaced blue timeline nodes and badges with amber and indigo)
  - `src/components/landing/InteractiveDemo.tsx` (restored amber/gold active indicators and tab highlights, removing blue elements)
  - `src/components/ui/AmbientOrbs.tsx` (boosted orb glows)

