import type { Card, BulletsContent } from '../../types/card';
import { MathText } from '../MathText';
import { ComplexityChart } from '../ComplexityChart';

interface Props {
  card: Card;
}

export function BulletsCard({ card }: Props) {
  const { points } = card.content as BulletsContent;
  const allText = points.join(' ');

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8">
      <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-white/10 text-white/70">
        {card.subject}
      </span>
      <h2 className="mb-8 text-2xl font-bold leading-tight text-center text-white">
        <MathText text={card.title} />
      </h2>
      <ul className="space-y-4 max-w-[340px] w-full">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <MathText text={point} className="text-base leading-relaxed text-white/80" />
          </li>
        ))}
      </ul>
      <ComplexityChart text={allText} />
      <span className="mt-8 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
