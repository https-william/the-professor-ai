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

### Digital Aesthetics Policy
DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:
 
Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
 
Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
 
Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
 
Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.
 
Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
 
Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""

### Branding: B&W Pen Tip Migration
- **What Changed:**
  - Migrated `BrandLogo.tsx` from Amber/accent colors to high-contrast monochrome using `var(--foreground)` and `var(--background)`.
  - Replaced all legacy "P" markers and `GraduationCap` icons with the `BrandLogo` component.
  - Copied user-generated rounded favicon files to `public/` (favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, android-chrome-*.png).
  - Dark mode favicon variants stored at `public/favicons/dark/` for future use.
  - Updated `layout.tsx` metadata to reference proper favicon paths and `site.webmanifest`.
  - Neutralized Indigo/Purple/Rose glows in `ErrorBoundary.tsx`.
  - Neutralized Amber loading spinners to `var(--foreground)`.
- **Files Modified:**
  - `src/components/ui/BrandLogo.tsx` (monochrome SVG)
  - `src/components/ui/Sidebar.tsx` (removed Indigo "P")
  - `src/components/navigation/DesktopSidebar.tsx` (BrandLogo integration)
  - `src/components/ui/ErrorBoundary.tsx` (neutral glows)
  - `src/app/summary/page.tsx` (B&W watermark in exports)
  - `src/app/layout.tsx` (favicon metadata + neutral spinner)
  - `src/app/dashboard/page.tsx` (useEffect import fix + neutral spinner)
  - `public/site.webmanifest` (NEW)
  - `public/favicon.ico`, `public/favicon-*.png`, `public/apple-touch-icon.png`, `public/android-chrome-*.png` (NEW — user assets)
