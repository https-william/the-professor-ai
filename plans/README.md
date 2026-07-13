# Animation Improvement Plans

This folder contains step-by-step, self-contained implementation plans designed to optimize UI animation easing, origin control, interruptibility, and GPU performance across key components of **The Professor** application.

These plans follow Emil Kowalski's design engineering principles to establish high-fidelity, premium motion.

## Audited Plans Index

| Number | Plan Title | Severity | Category | Status |
| :--- | :--- | :--- | :--- | :--- |
| **001** | [CommandPalette Instant Responsiveness](001-command-palette-instant.md) | **HIGH** | Purpose & frequency | TODO |
| **002** | [PillNav Snappiness and Press Feedback](002-pill-nav-snappy.md) | **MEDIUM** | Easing & duration | TODO |
| **003** | [FlashcardViewer Parallax Performance and Swipe Easing](003-flashcard-viewer-performance.md) | **HIGH** | Performance | TODO |

---

## Recommended Execution Order & Dependencies

To avoid conflicts and establish consistent motion configurations:

1. **Step 1: CSS Token Initialization (Prerequisite for Plan 003)**
   - **Dependency**: Add `--ease-in-out` custom token to `src/app/globals.css` as detailed in Step 1 of [Plan 003](003-flashcard-viewer-performance.md).
2. **Step 2: Implement Plan 001 (CommandPalette)**
   - **Rationale**: Isolated fix. Instant, high-impact removal of keyboard latency.
3. **Step 3: Implement Plan 002 (PillNav)**
   - **Rationale**: Snaps active state slide speed and adds immediate tactile press feedback.
4. **Step 4: Implement Plan 003 (FlashcardViewer)**
   - **Rationale**: Heavy optimization targeting mouse hover performance and gesture velocity detection.

---

## Quality Bar Checklist

Every implementation must be verified using the following testing steps in Chrome DevTools:

- [ ] **Animations Inspector**: Slow down playback speed to `10%` to verify spatial consistency and ensure transitions originate correctly.
- [ ] **Rendering Panel**: Toggle `prefers-reduced-motion: reduce` to verify layouts adapt gracefully (dropping translational coordinates but preserving opacity feedback).
- [ ] **Performance Monitor**: Profile CPU usage during high-frequency mouse hover over the flashcard deck to guarantee layout calculation drops.
