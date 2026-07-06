"use client";

import { useEffect, useCallback } from "react";

export function useCitationHighlight(containerRef: React.RefObject<HTMLElement | null>) {
  const highlightSnippet = useCallback((textToHighlight: string) => {
    if (!containerRef.current || !textToHighlight.trim()) return;

    // Check for native CSS Custom Highlight API support
    if (typeof CSS !== "undefined" && "highlights" in CSS && (CSS as any).highlights) {
      try {
        const ranges: Range[] = [];
        const treeWalker = document.createTreeWalker(
          containerRef.current,
          NodeFilter.SHOW_TEXT
        );

        let node: Node | null;
        const target = textToHighlight.toLowerCase().trim();

        while ((node = treeWalker.nextNode())) {
          const content = node.nodeValue?.toLowerCase() || "";
          let idx = content.indexOf(target);
          while (idx !== -1) {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + textToHighlight.length);
            ranges.push(range);
            idx = content.indexOf(target, idx + 1);
          }
        }

        if (ranges.length > 0) {
          const highlight = new (window as any).Highlight(...ranges);
          (CSS as any).highlights.set("citation-glow", highlight);

          // Scroll first match smoothly into view
          const firstRange = ranges[0];
          const rect = firstRange.getBoundingClientRect();
          if (rect && containerRef.current) {
            firstRange.startContainer.parentElement?.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          }
        }
      } catch (e) {
        console.warn("CSS Custom Highlight API failed, using fallback:", e);
      }
    } else {
      // Fallback: smooth scroll to text match
      const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode())) {
        if (n.nodeValue?.toLowerCase().includes(textToHighlight.toLowerCase().trim())) {
          n.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
          n.parentElement?.classList.add("bg-[var(--amber)]/30", "transition-colors", "duration-500");
          setTimeout(() => {
            n?.parentElement?.classList.remove("bg-[var(--amber)]/30");
          }, 2500);
          break;
        }
      }
    }
  }, [containerRef]);

  const clearHighlight = useCallback(() => {
    if (typeof CSS !== "undefined" && "highlights" in CSS && (CSS as any).highlights) {
      (CSS as any).highlights.delete("citation-glow");
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const styleId = "dynamic-citation-highlight-style";
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.innerHTML = `
          ::highlight(citation-glow) {
            background-color: rgba(229, 169, 60, 0.35);
            color: inherit;
            text-shadow: 0 0 12px rgba(229, 169, 60, 0.6);
            border-bottom: 2px solid #E5A93C;
          }
        `;
        document.head.appendChild(styleEl);
      }
    }
    return () => clearHighlight();
  }, [clearHighlight]);

  return { highlightSnippet, clearHighlight };
}
