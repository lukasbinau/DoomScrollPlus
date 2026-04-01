import type { Card, SummaryContent } from '../../types/card';
import { MathText } from '../MathText';
import { ComplexityChart, extractComplexities } from '../ComplexityChart';
import { ContentPopup } from '../ContentPopup';

interface Props {
  card: Card;
}

export function SummaryCard({ card }: Props) {
  const { text } = card.content as SummaryContent;
  const hasChart = extractComplexities(text).length > 0;

  return (
    <div className="flex flex-col items-center px-8 text-center w-full">
      <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-white/10 text-white/70">
        {card.subject}
      </span>
      <h2 className="mb-6 text-2xl font-bold leading-tight text-white">
        <MathText text={card.title} />
      </h2>
      <p className="text-lg leading-relaxed text-white/80 max-w-[340px]">
        <MathText text={text} />
      </p>
      <ContentPopup hidden={!hasChart}>
        <ComplexityChart text={text} />
      </ContentPopup>
      <span className="mt-8 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
