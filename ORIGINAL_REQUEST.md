# Original User Request

## Initial Request — 2026-07-11T04:17:28Z

Complete audit and repair of light mode layout flaws, hardcoded dark containers, and contrast/visibility issues across the core student-facing screens of The Professor AI.

Working directory: c:\Users\cutef\Downloads\My Projects\the-professor
Integrity mode: demo

## Requirements

### R1. Audit and Fix Hardcoded Dark Background Classes
Identify and replace hardcoded dark classes (such as `bg-zinc-950`, `bg-zinc-900`, `bg-black`, `bg-zinc-950/45`, `bg-slate-950`, etc.) with responsive theme-based backgrounds (`bg-[var(--card)]`, `bg-[var(--background-secondary)]`, etc.) or theme-conditioned classes (`bg-zinc-950 dark:bg-white` or `bg-zinc-100 dark:bg-zinc-950/45`) across the following core user-facing files:
- Dashboard: `src/app/dashboard/page.tsx`, `src/components/features/dashboard/HeroIngestionDropzone.tsx`, `src/components/features/dashboard/NotebooksTable.tsx`
- Library: `src/app/library/page.tsx`
- Pack Workspace / Study Lab: `src/app/library/pack/[id]/StudyPackClient.tsx`
- Flashcards: `src/components/features/InteractiveFlashcards.tsx`
- Quiz: `src/components/features/InteractiveQuiz.tsx`
- Roadmap: `src/components/features/StudyRoadmap.tsx`
- Profile: `src/app/profile/page.tsx`

### R2. Resolve Text Contrast and Font Visibility Issues in Light Mode
Ensure all text overlaying on white/light backgrounds does not use hardcoded white/muted-gray colors (e.g. `text-white`, `text-white/80`, `text-zinc-300`, `text-zinc-400`, `text-slate-300`). Replace them with theme variables (`text-[var(--foreground)]`, `text-[var(--foreground-secondary)]`, `text-[var(--foreground-muted)]`) or responsive Tailwind classes to guarantee high contrast and visibility in light mode.

### R3. Dynamicize Borders and Decorative Elements
Update hardcoded dark border classes (such as `border-white/5` or `border-white/10`) to use dynamic theme variables like `border-[var(--border)]` or `border-[var(--border-2)]` so borders render with proper contrast on both light and dark backgrounds.

## Acceptance Criteria

### Verification & Visual Correctness
- [ ] No hardcoded dark background containers (`bg-zinc-950`, `bg-zinc-900`, `bg-black` without dark variants) remain on the target dashboard, library, pack workspace, and profile pages.
- [ ] The text content, headers, explanation blocks, and button labels on all target screens render in readable dark text (`#0f172a` or similar) when `html.light` class is active.
- [ ] Borders and inputs dynamically adapt color to the active theme without visual overlap or clipping.
- [ ] Running `npx tsc --noEmit` returns zero compilation errors.
