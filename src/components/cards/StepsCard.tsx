import { useEffect, useRef, useState, useCallback } from 'react';
import type { Card, StepsContent } from '../../types/card';
import { MathText } from '../MathText';
import mermaid from 'mermaid';

interface Props {
  card: Card;
}

let stepsCounter = 0;

function StepDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = `steps-${++stepsCounter}`;
    let cancelled = false;

    mermaid.render(id, code).then(({ svg }) => {
      if (!cancelled && el) {
        el.innerHTML = svg;
        const svgEl = el.querySelector('svg');
        if (svgEl) {
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
  }, [code]);

  if (error) return <p className="text-xs text-red-400">Render error</p>;
  return <div ref={ref} className="w-full flex items-center justify-center" />;
}

export function StepsCard({ card }: Props) {
  const { steps, summary } = card.content as StepsContent;
  const [step, setStep] = useState(0);
  const total = steps.length;
  const current = steps[step];

  const advance = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (step < total - 1) setStep(s => s + 1);
  }, [step, total]);

  const goBack = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6">
      <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wider uppercase rounded-full bg-teal-500/20 text-teal-400">
        Step-by-Step · {card.subject}
      </span>
      <h2 className="mb-3 text-lg font-bold leading-tight text-center text-white">
        <MathText text={card.title} />
      </h2>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-3">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-teal-400' : i < step ? 'w-1.5 bg-teal-400/50' : 'w-1.5 bg-white/20'}`} />
        ))}
      </div>

      {/* Diagram area */}
      <div className="w-full max-w-[360px] max-h-[35vh] flex items-center justify-center overflow-auto scrollable-touch rounded-xl bg-white/[0.04] border border-white/10 p-3">
        <StepDiagram code={current.visual} />
      </div>

      {/* Step label */}
      <p className="mt-3 text-sm font-medium text-white/90 text-center max-w-[340px]">
        <MathText text={current.label} />
      </p>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={goBack}
          disabled={step === 0}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/10 text-white/70 disabled:opacity-30 transition-opacity active:scale-95"
        >
          ← Back
        </button>
        <span className="text-xs text-white/40">{step + 1} / {total}</span>
        <button
          onClick={advance}
          disabled={step === total - 1}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-500/30 text-teal-300 disabled:opacity-30 transition-opacity active:scale-95"
        >
          Next →
        </button>
      </div>

      {/* Summary shown on last step */}
      {step === total - 1 && (
        <p className="mt-3 text-xs text-white/50 text-center max-w-[300px]">
          <MathText text={summary} />
        </p>
      )}

      <span className="mt-3 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
