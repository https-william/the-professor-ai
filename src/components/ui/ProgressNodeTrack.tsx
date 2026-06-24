"use client";

import React from "react";
import { Check } from "lucide-react";

export interface ProgressNodeTrackProps {
  /** Total number of steps/nodes */
  total: number;
  /** Current active step (0-indexed) */
  current: number;
  /** Array of completed step indices */
  completed?: number[];
  /** Node size in pixels */
  nodeSize?: number;
  /** Color for completed nodes */
  completedColor?: string;
  /** Color for the active node */
  activeColor?: string;
  /** Optional labels for each node */
  labels?: string[];
  /** Click handler for node navigation */
  onNodeClick?: (index: number) => void;
  className?: string;
}

/**
 * Horizontal progress track with numbered/colored nodes.
 * Used in Summary (chapter progress), Quiz (question progress), Flashcards (card progress), etc.
 */
export default function ProgressNodeTrack({
  total,
  current,
  completed = [],
  nodeSize = 32,
  completedColor = 'var(--emerald)',
  activeColor = 'var(--amber)',
  labels,
  onNodeClick,
  className = '',
}: ProgressNodeTrackProps) {
  const completedSet = new Set(completed);

  return (
    <div className={`flex items-center w-full ${className}`} role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = completedSet.has(i);
        const isActive = i === current;
        const isPast = i < current;

        return (
          <React.Fragment key={i}>
            {/* Connector line */}
            {i > 0 && (
              <div
                className="flex-1 h-[2px] transition-colors duration-300"
                style={{
                  background: isPast || isCompleted
                    ? completedColor
                    : 'rgba(255, 255, 255, 0.08)',
                }}
              />
            )}

            {/* Node */}
            <button
              onClick={() => onNodeClick?.(i)}
              disabled={!onNodeClick}
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0 ${
                onNodeClick ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              }`}
              style={{
                width: nodeSize,
                height: nodeSize,
                fontSize: nodeSize * 0.4,
                fontWeight: 700,
                background: isCompleted
                  ? completedColor
                  : isActive
                  ? activeColor
                  : isPast
                  ? `${completedColor}40`
                  : 'rgba(255, 255, 255, 0.06)',
                color: isCompleted || isActive
                  ? '#000'
                  : 'rgba(255, 255, 255, 0.40)',
                boxShadow: isActive
                  ? `0 0 16px ${activeColor}40, 0 0 4px ${activeColor}60`
                  : 'none',
              }}
              aria-label={labels?.[i] || `Step ${i + 1}`}
              title={labels?.[i] || `Step ${i + 1}`}
            >
              {isCompleted ? (
                <Check size={nodeSize * 0.5} strokeWidth={3} />
              ) : (
                <span>{i + 1}</span>
              )}

              {/* Active pulse ring */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    background: `${activeColor}20`,
                    animationDuration: '2s',
                  }}
                />
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
