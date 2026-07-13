# 003 — FlashcardViewer Parallax Performance and Swipe Easing

- **Status**: TODO
- **Commit**: 140f430
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files (src/app/globals.css, src/components/features/flashcards/FlashcardViewer.tsx)

## Problem

The `FlashcardViewer` component is the core interactive study flow. It suffers from three major motion/animation issues:

1. **Jank on Mouse Move (Performance)**: The 3D parallax effect updates on every `onMouseMove` by modifying React state:
   ```typescript
   const [rotateX, setRotateX] = useState(0);
   const [rotateY, setRotateY] = useState(0);
   ```
   This triggers a full React component tree re-render (calculating SRS data, layout calculations, child components) at 60fps, dropping critical frames.
2. **Jarring 3D Flip (Easing & duration)**: When clicking to flip the card, the CSS transition defaults to `"transform 0.1s ease-out"` (line 564) because `cardState` is `'FLIPPED'` (not `'EVALUATED'`). A 100ms flip is way too fast, resulting in a flash-like glitch rather than a physical rotation.
3. **Hard Swiping Threshold (Interruptibility)**: Swiping the card away requires dragging it at least `120px` regardless of how fast (velocity) the user flicks it. This breaks physical gestures.

Current code:
```tsx
/* src/components/features/flashcards/FlashcardViewer.tsx:519 — current */
    // 3D Parallax Mouse coordinates
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;
        
        const calcY = (mouseX / (width / 2)) * 12;
        const calcX = -(mouseY / (height / 2)) * 12;

        setRotateX(calcX);
        setRotateY(calcY);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };
```
```tsx
/* src/components/features/flashcards/FlashcardViewer.tsx:560 — current */
    // 3D Card styles
    const cardInnerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        transition: cardState === 'EVALUATED' ? "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)" : "transform 0.1s ease-out",
        transformStyle: "preserve-3d",
        transform: `${cardState === 'IDLE' ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : `rotateX(${rotateX}deg) rotateY(${180 + rotateY}deg)`}`,
    };
```
```tsx
/* src/components/features/flashcards/FlashcardViewer.tsx:758 — current */
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.8}
                            style={{ x: dragX, rotate }}
                            onDragEnd={(event, info) => {
                                const threshold = 120;
                                if (info.offset.x > threshold) {
                                    handleRate(4); // Good
                                } else if (info.offset.x < -threshold) {
                                    handleRate(1); // Again
                                }
                            }}
```

## Target

1. **Compensated Parallax**: Replace local state coordinate tracking with Framer Motion `useMotionValue` objects and update them directly during pointer move. This eliminates layout calculation and component rendering runs.
2. **Apple-style Flip Transition**: Use Framer Motion `animate` to run a smooth spring animation from `0` to `180` degrees on Y axis when flipping, running fully on GPU.
3. **Velocity Gestures**: Check swiping speed `info.velocity.x` to allow snappy card dismissal when flicked quickly.

```tsx
/* target in FlashcardViewer.tsx */
    // Framer Motion values for performance and interruptible spring animation
    const parallaxX = useMotionValue(0);
    const parallaxY = useMotionValue(0);
    const cardRotateY = useMotionValue(0);

    useEffect(() => {
        // Animate the 3D flip via hardware-accelerated spring
        animate(cardRotateY, cardState === 'IDLE' ? 0 : 180, {
            type: "spring",
            stiffness: 180,
            damping: 24
        });
    }, [cardState, cardRotateY]);

    // Combine Y base rotation and interactive Y parallax
    const finalRotateY = useTransform([cardRotateY, parallaxY], ([baseY, pY]) => {
        // When card is flipped, invert parallax Y to match visual direction
        const multiplier = cardState === 'IDLE' ? 1 : -1;
        return (baseY as number) + multiplier * (pY as number);
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        
        parallaxY.set((mouseX / (rect.width / 2)) * 12);
        parallaxX.set(-(mouseY / (rect.height / 2)) * 12);
    };

    const handleMouseLeave = () => {
        animate(parallaxX, 0, { duration: 0.15 });
        animate(parallaxY, 0, { duration: 0.15 });
    };
```

## Repo conventions to follow

- Defines custom ease token `--ease-in-out` in `src/app/globals.css`.
- Leverages Framer Motion primitives (`useMotionValue`, `useTransform`, `animate`) inline.

## Steps

1. Open [src/app/globals.css](file:///C:/Users/cutef/Downloads/My%20Projects/the-professor/src/app/globals.css) and add the following variable inside `:root` (around line 50):
   ```css
   --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
   ```
2. Open [src/components/features/flashcards/FlashcardViewer.tsx](file:///C:/Users/cutef/Downloads/My%20Projects/the-professor/src/components/features/flashcards/FlashcardViewer.tsx).
3. Import `animate` from `framer-motion` at the top (add to import statement on line 9):
   ```typescript
   import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
   ```
4. Replace the parallax state declarations (lines 519-520):
   ```typescript
   const [rotateX, setRotateX] = useState(0);
   const [rotateY, setRotateY] = useState(0);
   ```
   with Framer Motion motion values:
   ```typescript
   const parallaxX = useMotionValue(0);
   const parallaxY = useMotionValue(0);
   const cardRotateY = useMotionValue(0);
   ```
5. Add an effect to animate the card Y rotation (around line 523):
   ```typescript
   useEffect(() => {
       animate(cardRotateY, cardState === 'IDLE' ? 0 : 180, {
           type: "spring",
           stiffness: 180,
           damping: 24
       });
   }, [cardState, cardRotateY]);

   const finalRotateY = useTransform([cardRotateY, parallaxY], ([baseY, pY]) => {
       const multiplier = cardState === 'IDLE' ? 1 : -1;
       return (baseY as number) + multiplier * (pY as number);
   });
   ```
6. Update `handleMouseMove` to modify the motion values directly:
   ```typescript
   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
       const card = e.currentTarget;
       const rect = card.getBoundingClientRect();
       const mouseX = e.clientX - rect.left - rect.width / 2;
       const mouseY = e.clientY - rect.top - rect.height / 2;
       
       parallaxY.set((mouseX / (rect.width / 2)) * 12);
       parallaxX.set(-(mouseY / (rect.height / 2)) * 12);
   };
   ```
7. Update `handleMouseLeave` to animate motion values back to zero:
   ```typescript
   const handleMouseLeave = () => {
       animate(parallaxX, 0, { duration: 0.15 });
       animate(parallaxY, 0, { duration: 0.15 });
   };
   ```
8. Remove the plain `cardInnerStyle` transition and transform calculation (lines 560-567):
   ```typescript
   const cardInnerStyle: React.CSSProperties = {
       position: "relative",
       width: "100%",
       height: "100%",
       transition: cardState === 'EVALUATED' ? "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)" : "transform 0.1s ease-out",
       transformStyle: "preserve-3d",
       transform: `${cardState === 'IDLE' ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : `rotateX(${rotateX}deg) rotateY(${180 + rotateY}deg)`}`,
   };
   ```
   Replace it with the following hardware-accelerated style using the motion values:
   ```typescript
   const cardInnerStyle: React.CSSProperties = {
       position: "relative",
       width: "100%",
       height: "100%",
       transformStyle: "preserve-3d",
   };
   ```
9. Locate the inner card container rendering:
   ```tsx
   <div style={cardInnerStyle}>
   ```
   Convert it to a Framer Motion `motion.div` so it can bind the motion values directly:
   ```tsx
   <motion.div style={{ ...cardInnerStyle, rotateX: parallaxX, rotateY: finalRotateY }}>
   ```
   And remember to update the closing tag (around line 914):
   ```tsx
   </motion.div>
   ```
10. Update the `onDragEnd` swiping handlers to include a velocity threshold check:
    ```typescript
    onDragEnd={(event, info) => {
        const threshold = 120;
        const velocityThreshold = 500; // pixels per second
        if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
            handleRate(4); // Good
        } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
            handleRate(1); // Again
        }
    }}
    ```

## Boundaries

- Do NOT alter SM2 Spaced Repetition logic.
- Do NOT touch text selection, TTS volume buttons, or metaphor simplify buttons.

## Verification

- **Mechanical**: Run `npm run build` to verify components package cleanly.
- **Feel check**:
  - Hover over the card. The card should tilt towards your mouse. Open Chrome DevTools Performance monitor and verify that mousemove events no longer trigger component render passes.
  - Click to flip the card. The card should rotate 180 degrees via a smooth spring flip.
  - Flick the card quickly to the right/left. The card should dismiss and register a review even if your gesture path did not exceed `120px` in length.
- **Done when**: `useState` coordinate tracking is removed, mousemove updates `useMotionValue` directly, and card flip uses `animate(cardRotateY)`.
