"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

interface SwipeConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enabled?: boolean;
}

interface UseSwipeReturn {
  isDragging: boolean;
  offset: { x: number; y: number };
  direction: "left" | "right" | "up" | "down" | null;
  bind: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
  reset: () => void;
}

export function useSwipe(config: SwipeConfig = {}): UseSwipeReturn {
  const {
    threshold = 80,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    enabled = true,
  } = config;

  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<"left" | "right" | "up" | "down" | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!enabled) return;
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
    setOffset({ x: 0, y: 0 });
    setDirection(null);
  }, [enabled]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !enabled) return;
    
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    
    setOffset({ x: dx, y: dy });
    
    // Determine primary direction
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? "right" : "left");
    } else {
      setDirection(dy > 0 ? "down" : "up");
    }
  }, [isDragging, enabled]);

  const handleEnd = useCallback(() => {
    if (!isDragging || !enabled) return;
    
    const { x, y } = offset;
    
    if (Math.abs(x) > Math.abs(y)) {
      // Horizontal swipe
      if (Math.abs(x) >= threshold) {
        if (x > 0 && onSwipeRight) onSwipeRight();
        else if (x < 0 && onSwipeLeft) onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (Math.abs(y) >= threshold) {
        if (y > 0 && onSwipeDown) onSwipeDown();
        else if (y < 0 && onSwipeUp) onSwipeUp();
      }
    }
    
    setIsDragging(false);
    setOffset({ x: 0, y: 0 });
    setDirection(null);
  }, [isDragging, offset, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, enabled]);

  const reset = useCallback(() => {
    setIsDragging(false);
    setOffset({ x: 0, y: 0 });
    setDirection(null);
  }, []);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const onMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const onMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setOffset({ x: 0, y: 0 });
    }
  }, [isDragging]);

  return {
    isDragging,
    offset,
    direction,
    bind: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
    reset,
  };
}

// Swipeable Card Component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 80,
  className = "",
  style = {},
}: SwipeableCardProps) {
  const { isDragging, offset, direction, bind } = useSwipe({
    threshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  });

  const getTransform = () => {
    if (!isDragging) return "translate(0, 0)";
    return `translate(${offset.x}px, ${offset.y}px)`;
  };

  const getOpacity = () => {
    if (!isDragging) return 1;
    const progress = Math.min(Math.abs(offset.x), Math.abs(offset.y)) / threshold;
    return Math.max(0.5, 1 - progress * 0.3);
  };

  // Calculate rotation based on horizontal movement
  const rotation = isDragging ? offset.x / 20 : 0;

  return (
    <div
      {...bind}
      className={`touch-none select-none ${className}`}
      style={{
        ...style,
        transform: getTransform(),
        opacity: getOpacity(),
        transition: isDragging ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
        transformStyle: "preserve-3d",
        perspective: "1000px",
        rotate: `${rotation}deg`,
      }}
    >
      {children}
      
      {/* Swipe Indicators */}
      {isDragging && direction && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {direction === "left" && offset.x < -threshold * 0.5 && (
            <div className="absolute left-4 px-4 py-2 rounded-xl bg-rose-500/80 text-white text-sm font-bold animate-pulse flex items-center">
              <ChevronLeft size={18} strokeWidth={1.5} className="mr-2" />
              Previous
            </div>
          )}
          {direction === "right" && offset.x > threshold * 0.5 && (
            <div className="absolute right-4 px-4 py-2 rounded-xl bg-emerald-500/80 text-white text-sm font-bold animate-pulse flex items-center">
              Next
              <ChevronRight size={18} strokeWidth={1.5} className="ml-2" />
            </div>
          )}
          {direction === "up" && offset.y < -threshold * 0.5 && (
            <div className="absolute top-4 px-4 py-2 rounded-xl bg-blue-500/80 text-white text-sm font-bold animate-pulse flex items-center">
              <RotateCw size={18} strokeWidth={1.5} className="mr-2" />
              Flip
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Swipe to navigate wrapper for pages
interface SwipeNavigatorProps {
  children: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  enabled?: boolean;
}

export function SwipeNavigator({ 
  children, 
  onNext, 
  onPrev,
  enabled = true 
}: SwipeNavigatorProps) {
  const { isDragging, offset, direction, bind } = useSwipe({
    threshold: 100,
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
    enabled,
  });

  return (
    <div 
      {...bind}
      className="touch-none select-none"
      style={{
        transition: isDragging ? "none" : "transform 0.3s ease-out",
        transform: `translateX(${isDragging ? offset.x : 0}px)`,
      }}
    >
      {children}
    </div>
  );
}
