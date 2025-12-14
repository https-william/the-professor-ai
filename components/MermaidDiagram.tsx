
import React, { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

declare global {
  interface Window {
    mermaid: any;
  }
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);

    const renderChart = async () => {
      if (!containerRef.current || !window.mermaid) return;

      try {
        // Initialize with strict error suppression
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          suppressErrorRendering: true, // Critical: Stop mermaid from injecting error divs
          logLevel: 5 // Silence console logs
        });

        // Unique ID for this render cycle
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Attempt to render
        const { svg } = await window.mermaid.render(id, chart);
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (isMounted) {
          // Silent failure - do not log to console to avoid user panic
          setHasError(true);
          if (containerRef.current) {
             containerRef.current.innerHTML = ''; // Ensure container is clean
          }
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(renderChart, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [chart]);

  if (hasError) {
      // Visual Fallback (Invisible to user mostly, just takes up less space)
      return (
          <div className="my-4 py-6 border-t border-b border-white/5 flex flex-col items-center justify-center gap-2 opacity-50">
              <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Visual Data Corrupted</span>
          </div>
      );
  }

  return (
    <div ref={containerRef} className="my-6 flex justify-center overflow-x-auto p-4 bg-black/20 rounded-xl border border-white/5 min-h-[100px] transition-all" />
  );
};
