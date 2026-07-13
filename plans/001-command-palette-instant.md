# 001 — CommandPalette Instant Responsiveness

- **Status**: TODO
- **Commit**: 140f430
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file (src/components/ui/CommandPalette.tsx)

## Problem

The `CommandPalette` component is a high-frequency interface element triggered by the keyboard shortcut `Cmd/Ctrl + K`. Currently, it uses entry transition animations (`animate-in fade-in zoom-in-95 duration-150`) on the dialog container.

According to the design guidelines:
- High-frequency UI elements (accessed 100+ times/day) must open and close instantly with **no animation**.
- Animations on keyboard-initiated actions delay the UI's display and feel sluggish.
- The entry animation is asymmetric as there is no corresponding exit transition (the dialog is removed instantly on close via `if (!isOpen) return null`).

Current code:
```tsx
/* src/components/ui/CommandPalette.tsx:174 — current */
      {/* Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-[var(--background)] border border-[var(--border-2)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
```

## Target

Remove all open/close transition and animation classes from the main dialog container to ensure the Command Palette mounts instantly. Also remove transition classes from the backdrop to guarantee snappy presentation.

```tsx
/* target */
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-[var(--background)] border border-[var(--border-2)] shadow-2xl overflow-hidden">
```

## Repo conventions to follow

- Changes should be made inside [CommandPalette.tsx](file:///C:/Users/cutef/Downloads/My%20Projects/the-professor/src/components/ui/CommandPalette.tsx).
- No new classes or external libraries should be introduced.

## Steps

1. Open [src/components/ui/CommandPalette.tsx](file:///C:/Users/cutef/Downloads/My%20Projects/the-professor/src/components/ui/CommandPalette.tsx).
2. Locate the backdrop `div` (around line 168):
   ```tsx
   <div 
     className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
     onClick={handleClose}
   />
   ```
   Remove `transition-opacity` from the `className`:
   ```tsx
   <div 
     className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
     onClick={handleClose}
   />
   ```
3. Locate the dialog container `div` (around line 174):
   ```tsx
   <div className="relative w-full max-w-xl rounded-2xl bg-[var(--background)] border border-[var(--border-2)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
   ```
   Remove the classes `animate-in fade-in zoom-in-95 duration-150`:
   ```tsx
   <div className="relative w-full max-w-xl rounded-2xl bg-[var(--background)] border border-[var(--border-2)] shadow-2xl overflow-hidden">
   ```

## Boundaries

- Do NOT touch the state variables, router push effects, or keyboard handlers.
- Do NOT change structural tags or elements.

## Verification

- **Mechanical**: Run `npm run build` or `npx tsc` to verify there are no compilation errors.
- **Feel check**:
  - Open the app, press `Ctrl + K` (or `Cmd + K`), and verify that the command palette opens instantly.
  - Press `Esc` and verify that it closes instantly with no fade or visual lag.
  - Verify that navigating options via keyboard remains responsive.
- **Done when**: `animate-in fade-in zoom-in-95 duration-150` and `transition-opacity` are removed from the command palette JSX, and opening it has 0ms visual delay.
