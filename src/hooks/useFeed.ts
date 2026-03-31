import { useMemo } from 'react';
import type { Card, UserState } from '../types/card';

interface UseFeedOptions {
  cards: Card[];
  userState: UserState;
  selectedSubject: string | null; // null = all
  showBookmarked: boolean;
}

export function useFeed({ cards, userState, selectedSubject, showBookmarked }: UseFeedOptions): Card[] {
  return useMemo(() => {
    let filtered = cards;

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter(c => c.subject === selectedSubject);
    }

    // Bookmarks mode
    if (showBookmarked) {
      filtered = filtered.filter(c => userState[c.id]?.bookmarked);
      return filtered;
    }

    // Hide learned cards
    filtered = filtered.filter(c => !userState[c.id]?.learned);

    // Spaced repetition sort: cards not seen recently float up
    const now = Date.now();
    const scored = filtered.map(card => {
      const state = userState[card.id];
      const lastSeen = state?.lastSeen ?? 0;
      const age = now - lastSeen;
      // Never-seen cards get max priority, then by staleness
      const priority = lastSeen === 0 ? Number.MAX_SAFE_INTEGER : age;
      return { card, priority };
    });

    // Sort by priority descending (highest = most stale = show first)
    scored.sort((a, b) => b.priority - a.priority);

    // Shuffle within priority tiers to add variety
    // Group into: never-seen, stale (>1hr), recent
    const neverSeen: Card[] = [];
    const stale: Card[] = [];
    const recent: Card[] = [];
    const ONE_HOUR = 60 * 60 * 1000;

    for (const { card } of scored) {
      const lastSeen = userState[card.id]?.lastSeen ?? 0;
      if (lastSeen === 0) neverSeen.push(card);
      else if (now - lastSeen > ONE_HOUR) stale.push(card);
      else recent.push(card);
    }

    // Shuffle within each tier
    shuffle(neverSeen);
    shuffle(stale);
    shuffle(recent);

    return [...neverSeen, ...stale, ...recent];
  }, [cards, userState, selectedSubject, showBookmarked]);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
