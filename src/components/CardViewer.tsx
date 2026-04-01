import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type { Card, UserCardState } from '../types/card';
import { SummaryCard } from './cards/SummaryCard';
import { BulletsCard } from './cards/BulletsCard';
import { FlashCard } from './cards/FlashCard';
import { QuizCard } from './cards/QuizCard';
import { DiagramCard } from './cards/DiagramCard';
import { CodeCard } from './cards/CodeCard';
import { StepsCard } from './cards/StepsCard';

interface Props {
  cards: Card[];
  userState: Record<string, UserCardState>;
  brainrot: boolean;
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
    case 'diagram': return <DiagramCard card={card} />;
    case 'code': return <CodeCard card={card} />;
    case 'steps': return <StepsCard card={card} />;
  }
}

export function CardViewer({ cards, userState, brainrot, onSeen, onBookmark, onLearn }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAnimating = useRef(false);
  const onSeenRef = useRef(onSeen);
  onSeenRef.current = onSeen;

  // Stable key: only changes when the actual set/order of card IDs changes
  const feedKey = useMemo(() => cards.map(c => c.id).join(','), [cards]);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, cards.length - 1));
    if (clamped === currentIndex) return;
    isAnimating.current = true;
    setCurrentIndex(clamped);
    onSeenRef.current(cards[clamped].id);
    setTimeout(() => { isAnimating.current = false; }, 400);
  }, [cards, currentIndex]);

  // Reset to card 0 only when the feed genuinely changes (filter/subject change)
  useEffect(() => {
    setCurrentIndex(0);
    if (cards.length > 0) onSeenRef.current(cards[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedKey]);

  // Touch + wheel handlers on window
  useEffect(() => {
    let startY = 0;
    let inScrollable = false;
    let cardScrollEl: HTMLElement | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      const target = e.target as HTMLElement;
      const scrollable = target.closest('.scrollable-touch') as HTMLElement | null;

      if (scrollable) {
        const isCardBody = scrollable.classList.contains('card-body');
        if (isCardBody) {
          const hasOverflow = scrollable.scrollHeight > scrollable.clientHeight + 1;
          inScrollable = hasOverflow;
          cardScrollEl = hasOverflow ? scrollable : null;
        } else {
          // Inner scrollable (code block, diagram)
          inScrollable = true;
          cardScrollEl = null;
        }
      } else {
        inScrollable = false;
        cardScrollEl = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!inScrollable) e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimating.current) return;

      const deltaY = startY - e.changedTouches[0].clientY;

      if (cardScrollEl) {
        // Card-body scroll: allow swipe at edges
        const atTop = cardScrollEl.scrollTop <= 1;
        const atBottom = cardScrollEl.scrollTop + cardScrollEl.clientHeight >= cardScrollEl.scrollHeight - 1;

        if (Math.abs(deltaY) > 50) {
          if ((deltaY > 0 && atBottom) || (deltaY < 0 && atTop)) {
            goTo(deltaY > 0 ? currentIndex + 1 : currentIndex - 1);
          }
        }
        return;
      }

      if (inScrollable) return;

      if (Math.abs(deltaY) > 50) {
        goTo(deltaY > 0 ? currentIndex + 1 : currentIndex - 1);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating.current) return;
      if (Math.abs(e.deltaY) > 30) {
        goTo(e.deltaY > 0 ? currentIndex + 1 : currentIndex - 1);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('wheel', onWheel);
    };
  }, [currentIndex, goTo]);

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-lg">
        No cards to show
      </div>
    );
  }

  // Only render current card ± 1 for performance
  const visible = [-1, 0, 1]
    .map(offset => currentIndex + offset)
    .filter(i => i >= 0 && i < cards.length);

  return (
    <div className="snap-container">
      {visible.map((i) => {
        const card = cards[i];
        const state = userState[card.id];
        const isBookmarked = state?.bookmarked ?? false;
        const isLearned = state?.learned ?? false;
        const offset = i - currentIndex;

        return (
          <div
            key={card.id}
            className="snap-card absolute inset-0"
            style={{
              transform: `translateY(${offset * 100}%)`,
              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

            {/* Card content */}
            <div className={`card-body relative h-full ${brainrot ? 'overflow-hidden' : 'overflow-hidden'}`}>
              <div className={brainrot ? 'card-compact h-full flex flex-col items-center justify-center pt-12 pb-20' : 'h-full flex flex-col items-center justify-center pt-14 pb-24'}>
                {renderCard(card)}
              </div>
            </div>

            {/* Bottom action buttons */}
            <div className="absolute bottom-6 left-4 right-4 safe-bottom flex items-end justify-between pointer-events-none">
              {/* Learned - bottom left */}
              <button
                onClick={() => onLearn(card.id)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90 pointer-events-auto"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLearned ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/50">Learned</span>
              </button>

              {/* Save - bottom right */}
              <button
                onClick={() => onBookmark(card.id)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90 pointer-events-auto"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBookmarked ? 'bg-violet-500' : 'bg-white/10'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isBookmarked ? 'white' : 'none'} stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/50">Save</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
