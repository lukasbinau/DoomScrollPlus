import { useRef, useEffect, useCallback } from 'react';
import type { Card, UserCardState } from '../types/card';
import { SummaryCard } from './cards/SummaryCard';
import { BulletsCard } from './cards/BulletsCard';
import { FlashCard } from './cards/FlashCard';
import { QuizCard } from './cards/QuizCard';

interface Props {
  cards: Card[];
  userState: Record<string, UserCardState>;
  onSeen: (id: string) => void;
  onBookmark: (id: string) => void;
  onLearn: (id: string) => void;
}

function renderCard(card: Card) {
  switch (card.type) {
    case 'summary': return <SummaryCard card={card} />;
    case 'bullets': return <BulletsCard card={card} />;
    case 'flashcard': return <FlashCard card={card} />;
    case 'quiz': return <QuizCard card={card} />;
  }
}

export function CardViewer({ cards, userState, onSeen, onBookmark, onLearn }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);

  // Mark card as seen when it comes into view
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== currentIndexRef.current && cards[index]) {
      currentIndexRef.current = index;
      onSeen(cards[index].id);
    }
  }, [cards, onSeen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    // Mark first card as seen
    if (cards.length > 0) onSeen(cards[0].id);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [cards, handleScroll, onSeen]);

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-lg">
        No cards to show
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="snap-container hide-scrollbar"
    >
      {cards.map((card) => {
        const state = userState[card.id];
        const isBookmarked = state?.bookmarked ?? false;
        const isLearned = state?.learned ?? false;

        return (
          <div key={card.id} className="snap-card relative">
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

            {/* Card content */}
            <div className="relative h-full">
              {renderCard(card)}
            </div>

            {/* Right action bar */}
            <div className="absolute right-4 bottom-24 safe-bottom flex flex-col items-center gap-5">
              {/* Bookmark */}
              <button
                onClick={() => onBookmark(card.id)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBookmarked ? 'bg-violet-500' : 'bg-white/10'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isBookmarked ? 'white' : 'none'} stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/50">Save</span>
              </button>

              {/* Mark learned */}
              <button
                onClick={() => onLearn(card.id)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLearned ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/50">Learned</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
