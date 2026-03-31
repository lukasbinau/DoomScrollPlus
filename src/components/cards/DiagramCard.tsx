import { useEffect, useRef, useState } from 'react';
import type { Card, DiagramContent } from '../../types/card';
import { MathText } from '../MathText';
import { ContentPopup } from '../ContentPopup';
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
        const svgEl = el.querySelector('svg');
        if (svgEl) {
          // Get the natural size and set a proper viewBox so SVG scales to fit
          const bbox = svgEl.getBBox();
          const vbPad = 10;
          svgEl.setAttribute('viewBox', `${bbox.x - vbPad} ${bbox.y - vbPad} ${bbox.width + vbPad * 2} ${bbox.height + vbPad * 2}`);
          svgEl.removeAttribute('height');
          svgEl.style.width = '100%';
          svgEl.style.height = 'auto';
          svgEl.style.maxHeight = '100%';
        }
      }
    }).catch(() => {
      if (!cancelled) setError(true);
    });

    return () => { cancelled = true; };
  }, [mermaidCode]);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6">
      <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider uppercase rounded-full bg-indigo-500/20 text-indigo-400">
        Diagram · {card.subject}
      </span>
      <h2 className="mb-4 text-xl font-bold leading-tight text-center text-white">
        <MathText text={card.title} />
      </h2>

      <ContentPopup>
        <div className="w-full max-w-[360px] max-h-[50vh] flex items-center justify-center overflow-auto scrollable-touch rounded-xl bg-white/[0.04] border border-white/10 p-4">
          {error ? (
            <p className="text-sm text-red-400">Failed to render diagram</p>
          ) : (
            <div ref={containerRef} className="diagram-container w-full flex items-center justify-center" />
          )}
        </div>
      </ContentPopup>

      <p className="mt-4 text-sm leading-relaxed text-white/70 text-center max-w-[340px]">
        <MathText text={caption} />
      </p>
      <span className="mt-4 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
