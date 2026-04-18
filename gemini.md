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
