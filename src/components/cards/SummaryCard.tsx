import type { Card, SummaryContent } from '../../types/card';

interface Props {
  card: Card;
}

export function SummaryCard({ card }: Props) {
  const { text } = card.content as SummaryContent;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-white/10 text-white/70">
        {card.subject}
      </span>
      <h2 className="mb-6 text-2xl font-bold leading-tight text-white">
        {card.title}
      </h2>
      <p className="text-lg leading-relaxed text-white/80 max-w-[340px]">
        {text}
      </p>
      <span className="mt-8 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
