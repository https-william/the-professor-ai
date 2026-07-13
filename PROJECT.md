# Project: The Professor AI - Light Mode Contrast & Theme Alignment

## Architecture
The Professor AI is a Next.js application supporting light/dark theme toggle. The project aims to audit and fix hardcoded dark classes, low text contrast, and static borders across student-facing components, ensuring full theme adaptability.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1_EXPLORE_AUDIT | Audit all target files to identify hardcoded classes, contrast issues, and static borders. | None | DONE: Reports in `.agents/teamwork_preview_explorer_m1_*/audit_report.md` |
| 2 | M2_REPAIR | Repair Dashboard, Library, Study Lab, and Profile files based on Explorer audit findings. | M1_EXPLORE_AUDIT | DONE: Fixed hardcoded classes, borders, and text contrast |
| 3 | M3_VERIFICATION | Final check for TypeScript compilation (`npx tsc --noEmit`) and visual correct rendering. | M2_REPAIR | DONE: Verified compilation is clean and audit reports are clean |

## Interface Contracts
- Backgrounds must use CSS variables like `bg-[var(--card)]` or responsive Tailwind prefixes (e.g. `bg-white dark:bg-zinc-950`).
- Text colors must avoid hardcoded white/light colors on light backgrounds, using variables like `text-[var(--foreground)]` or responsive Tailwind classes.
- Borders must adapt using `border-[var(--border)]`, `border-[var(--border-2)]`, etc.
- No direct modification of core styling assets except targeting the listed file scopes.
