import { useState } from 'react';
import type { Card, FlashcardContent } from '../../types/card';

interface Props {
  card: Card;
}

export function FlashCard({ card }: Props) {
  const [flipped, setFlipped] = useState(false);
  const { question, answer } = card.content as FlashcardContent;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-amber-500/20 text-amber-400">
        Flashcard · {card.subject}
      </span>

      <div
        className="flip-card w-full max-w-[340px] h-[280px] cursor-pointer"
        onClick={() => setFlipped(!flipped)}
      >
        <div className={`flip-card-inner relative w-full h-full ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/[0.06] border border-white/10 p-6">
            <span className="mb-4 text-xs font-semibold tracking-wider uppercase text-white/40">
              Question
            </span>
            <p className="text-xl font-semibold leading-snug text-center text-white">
              {question}
            </p>
            <span className="mt-6 text-xs text-white/30">Tap to reveal</span>
          </div>

          {/* Back */}
          <div className="flip-card-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 p-6">
            <span className="mb-4 text-xs font-semibold tracking-wider uppercase text-violet-400">
              Answer
            </span>
            <p className="text-lg leading-relaxed text-center text-white/90">
              {answer}
            </p>
            <span className="mt-6 text-xs text-white/30">Tap to flip back</span>
          </div>
        </div>
      </div>

      <span className="mt-8 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
