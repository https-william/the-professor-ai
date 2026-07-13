# 002 — PillNav Snappiness and Press Feedback

- **Status**: TODO
- **Commit**: 140f430
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 1 file (src/components/ui/PillNav.tsx)

## Problem

The `PillNav` component is a tab-navigation UI element hit tens of times per day. It has two animation problems:
1. **Easing & duration**: The shared slide background (`motion.div`) uses a spring transition with a duration of `0.6` seconds (`transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}`). A duration of `0.6` is too slow for high-frequency navigation tabs, making the sliding backdrop glide sluggishly behind the user's cursor.
2. **Physicality & origin**: The navigation buttons lack physical press feedback. Tap targets should feel physical and interactive. There is no active state scale-down transition when clicking tabs.

Current code:
```tsx
/* src/components/ui/PillNav.tsx:18 — current */
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={cn(
                        "relative px-4 py-2 rounded-full text-sm font-medium transition-colors z-10",
                        activeId === item.id ? "text-white" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    {activeId === item.id && (
                        <motion.div
                            layoutId="pill-nav"
                            className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-lg shadow-[var(--accent)]/20"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
```

## Target

1. Snapped duration: Reduce spring duration to `0.4` seconds and subtle bounce to `0.15` to make layout transition responsive.
2. Press feedback: Add an `:active` CSS transformation to scale the button to `0.96` with a crisp `100ms` exit curve.

```tsx
/* target */
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={cn(
                        "relative px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96] duration-100 ease-out z-10",
                        activeId === item.id ? "text-white" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    {activeId === item.id && (
                        <motion.div
                            layoutId="pill-nav"
                            className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-lg shadow-[var(--accent)]/20"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                    )}
```

## Repo conventions to follow

- Modifies [PillNav.tsx](file:///C:/Users/cutef/Downloads/My%20Projects/the-professor/src/components/ui/PillNav.tsx).
- Follows existing styling patterns utilizing Tailwind utility classes and native CSS transitions.

## Steps

1. Open [src/components/ui/PillNav.tsx](file:///C:/Users/cutef/Downloads/My%20Projects/the-professor/src/components/ui/PillNav.tsx).
2. Locate the `<button>` declaration (around line 18):
   ```tsx
   className={cn(
       "relative px-4 py-2 rounded-full text-sm font-medium transition-colors z-10",
       activeId === item.id ? "text-white" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
   )}
   ```
   Modify `transition-colors` to `transition-all active:scale-[0.96] duration-100 ease-out`:
   ```tsx
   className={cn(
       "relative px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96] duration-100 ease-out z-10",
       activeId === item.id ? "text-white" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
   )}
   ```
3. Locate the backdrop transition property (around line 30):
   ```tsx
   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
   ```
   Modify `bounce` to `0.15` and `duration` to `0.4`:
   ```tsx
   transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
   ```

## Boundaries

- Do NOT change the layout hierarchy (keep `motion.div` absolute).
- Do NOT touch the state selectors or props.

## Verification

- **Mechanical**: Run `npm run build` or `npx tsc` to verify TypeScript builds properly.
- **Feel check**:
  - Open navigation layout. Click between tabs rapidly. Verify the background pill slides snappily with no sluggish trailing lag.
  - Press down on a tab. Check that the tab button visually shrinks slightly (`0.96` scale) while held, and restores on release, simulating physical press feedback.
- **Done when**: `duration: 0.6` is updated to `duration: 0.4` and `active:scale-[0.96]` class exists on the nav button.
