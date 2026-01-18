
# Phase 6: Optimization, Polish & Launch Readiness

With the Core Intelligence, Gamification, and VoIP Infrastructure in place, Phase 6 focuses on hardening the application for production deployment. We move from "It works" to "It feels professional."

## 1. Performance Engineering
- [ ] **Bundle Analysis**: Use `rollup-plugin-visualizer` to identify heavy chunks.
- [ ] **Code Splitting**: Ensure `pdfjs-dist` and `mammoth` are strictly lazy-loaded and not in the main bundle.
- [ ] **Image Optimization**: Convert static assets to WebP/AVIF.
- [ ] **Memoization Audit**: Review `App.tsx` and `QuizView.tsx` for unnecessary re-renders.

## 2. Progressive Web App (PWA) Maturity
- [ ] **Service Worker Strategy**: Implement `vite-plugin-pwa` with a "Stale-While-Revalidate" strategy for core assets.
- [ ] **Offline Fallback**: Ensure the App Shell (UI) loads offline even if API calls fail.
- [ ] **Restore the Install Prompt**: Refine the `PWAPrompt` logic to be less intrusive (e.g., check `beforeinstallprompt` event properly).

## 3. SEO & Social Sharing (The Graph)
- [ ] **Dynamic Meta Tags**: Update `<head>` title/description based on the active View (e.g., "Taking an Exam on Biology 101 | The Professor").
- [ ] **Open Graph Images**: Generate dynamic OG images for shared exams/lectures using a serverless function (or static fallbacks).
- [ ] **Sitemap.xml**: Generate a sitemap for the Landing and Pricing pages.

## 4. Accessibility (a11y) & Mobile Polish
- [ ] **Touch Targets**: Ensure all buttons on `MobileNavBar` and `FloatingDock` are at least 44x44px tappable areas.
- [ ] **Keyboard Nav**: Verify tab indexing in Modals (`UserProfileModal`, `LockInModal`).
- [ ] **Screen Reader**: Add `aria-label` to all icon-only buttons (Back, Close, Settings).

## 5. Security Hardening
- [ ] **Input Sanitization**: Double-check `dompurify` config in `ChatView` and `ProfessorView`.
- [ ] **Rate Limiting**: Ensure the Supabase Edge Functions (Paystack, etc.) handle abuse gracefully.
- [ ] **Content Policy**: Review `forbidden_patterns` in `geminiService.ts` to ensure safety filters are robust.

## 6. Pre-Flight Checklist
- [ ] Verify Stripe/Paystack Webhooks in Production mode.
- [ ] Test Google Auth on mobile Safari (common failure point).
- [ ] Verify Camera/Mic permissions handling on iOS (requires HTTPS).
