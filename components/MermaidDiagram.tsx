
import React, { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (containerRef.current && window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
      });
      
      const render = async () => {
        try {
          // Clear previous
          containerRef.current!.innerHTML = '';
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await window.mermaid.render(id, chart);
          if (containerRef.current) {
             containerRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error("Mermaid Render Error", error);
          if (containerRef.current) containerRef.current.innerHTML = `<div class="text-xs text-red-400">Diagram Error</div>`;
        }
      };
      
      render();
    }
  }, [chart]);

  return <div ref={containerRef} className="my-4 flex justify-center overflow-x-auto p-4 bg-black/20 rounded-xl border border-white/5" />;
};
