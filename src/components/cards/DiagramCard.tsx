import { useEffect, useRef, useState } from 'react';
import type { Card, DiagramContent } from '../../types/card';
import { MathText } from '../MathText';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    primaryColor: '#7c3aed',
    primaryTextColor: '#fff',
    primaryBorderColor: '#7c3aed',
    lineColor: '#a78bfa',
    secondaryColor: '#4c1d95',
    tertiaryColor: '#1e1b4b',
    nodeTextColor: '#fff',
    edgeLabelBackground: 'transparent',
    clusterBkg: '#1e1b4b',
    clusterBorder: '#7c3aed',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontSize: '14px',
  },
  flowchart: { curve: 'basis', padding: 12 },
  securityLevel: 'strict',
});

interface Props {
  card: Card;
}

let diagramCounter = 0;

export function DiagramCard({ card }: Props) {
  const { mermaid: mermaidCode, caption } = card.content as DiagramContent;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const id = `mermaid-${++diagramCounter}`;
    let cancelled = false;

    mermaid.render(id, mermaidCode).then(({ svg }) => {
      if (!cancelled && el) {
        el.innerHTML = svg;
        // Scale SVG to fit
        const svgEl = el.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.maxHeight = '100%';
          svgEl.style.height = 'auto';
        }
      }
    }).catch(() => {
      if (!cancelled) setError(true);
    });

    return () => { cancelled = true; };
  }, [mermaidCode]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider uppercase rounded-full bg-indigo-500/20 text-indigo-400">
        Diagram · {card.subject}
      </span>
      <h2 className="mb-4 text-xl font-bold leading-tight text-center text-white">
        <MathText text={card.title} />
      </h2>

      <div className="w-full max-w-[360px] max-h-[45vh] flex items-center justify-center overflow-hidden rounded-xl bg-white/[0.04] border border-white/10 p-4">
        {error ? (
          <p className="text-sm text-red-400">Failed to render diagram</p>
        ) : (
          <div ref={containerRef} className="diagram-container w-full flex items-center justify-center" />
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/70 text-center max-w-[340px]">
        <MathText text={caption} />
      </p>
      <span className="mt-4 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
