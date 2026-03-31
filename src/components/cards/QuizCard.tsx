import { useState } from 'react';
import type { Card, QuizContent } from '../../types/card';
import { MathText } from '../MathText';

interface Props {
  card: Card;
}

export function QuizCard({ card }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const { question, options, correctIndex } = card.content as QuizContent;

  const handleSelect = (index: number) => {
    if (selected !== null) return; // already answered
    setSelected(index);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-emerald-500/20 text-emerald-400">
        Quiz · {card.subject}
      </span>

      <h2 className="mb-8 text-xl font-bold leading-snug text-center text-white max-w-[340px]">
        <MathText text={question} />
      </h2>

      <div className="w-full max-w-[340px] space-y-3">
        {options.map((option, i) => {
          let style = 'bg-white/[0.06] border-white/10 text-white/80';
          if (selected !== null) {
            if (i === correctIndex) {
              style = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
            } else if (i === selected && i !== correctIndex) {
              style = 'bg-red-500/20 border-red-500/40 text-red-300';
            } else {
              style = 'bg-white/[0.03] border-white/5 text-white/40';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full py-4 px-5 rounded-xl border text-left text-base transition-all duration-200 ${style} ${selected === null ? 'active:scale-[0.98]' : ''}`}
            >
              <span className="mr-3 font-semibold text-white/40">
                {String.fromCharCode(65 + i)}
              </span>
              <MathText text={option} />
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className={`mt-6 text-sm font-medium ${selected === correctIndex ? 'text-emerald-400' : 'text-red-400'}`}>
          {selected === correctIndex ? 'Correct! ✓' : `Wrong — the answer is ${String.fromCharCode(65 + correctIndex)}`}
        </p>
      )}

      <span className="mt-6 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
