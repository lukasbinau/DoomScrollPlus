import { useMemo, useRef } from 'react';
import type { Card, UserState } from '../types/card';

interface UseFeedOptions {
  cards: Card[];
  userState: UserState;
  selectedCourse: string | null;
  selectedSubject: string | null;
  showBookmarked: boolean;
}

export function useFeed({ cards, userState, selectedCourse, selectedSubject, showBookmarked }: UseFeedOptions): Card[] {
  // Cache the feed so we only reshuffle when the actual set of cards changes,
  // not when userState changes (e.g. lastSeen updates from onSeen).
  const cachedFeedRef = useRef<Card[]>([]);
  const cachedKeyRef = useRef<string>('');

  return useMemo(() => {
    let filtered = cards;

    // Filter by course
    if (selectedCourse) {
      filtered = filtered.filter(c => c.course === selectedCourse);
    }

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter(c => c.subject === selectedSubject);
    }

    // Bookmarks mode
    if (showBookmarked) {
      filtered = filtered.filter(c => userState[c.id]?.bookmarked);
      const key = 'bm:' + filtered.map(c => c.id).sort().join(',');
      if (key === cachedKeyRef.current) return cachedFeedRef.current;
      cachedKeyRef.current = key;
      cachedFeedRef.current = filtered;
      return filtered;
    }

    // Hide learned cards
    filtered = filtered.filter(c => !userState[c.id]?.learned);

    // Build a key from the set of filtered card IDs.
    // If the set hasn't changed (just a lastSeen update), return the cached order.
    const key = filtered.map(c => c.id).sort().join(',');
    if (key === cachedKeyRef.current) {
      return cachedFeedRef.current;
    }
    cachedKeyRef.current = key;

    // Spaced repetition sort: cards not seen recently float up
    const now = Date.now();

    // Shuffle within priority tiers to add variety
    // Group into: never-seen, stale (>1hr), recent
    const neverSeen: Card[] = [];
    const stale: Card[] = [];
    const recent: Card[] = [];
    const ONE_HOUR = 60 * 60 * 1000;

    for (const card of filtered) {
      const lastSeen = userState[card.id]?.lastSeen ?? 0;
      if (lastSeen === 0) neverSeen.push(card);
      else if (now - lastSeen > ONE_HOUR) stale.push(card);
      else recent.push(card);
    }

    // Shuffle within each tier
    shuffle(neverSeen);
    shuffle(stale);
    shuffle(recent);

    const result = [...neverSeen, ...stale, ...recent];
    cachedFeedRef.current = result;
    return result;
  }, [cards, userState, selectedCourse, selectedSubject, showBookmarked]);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
