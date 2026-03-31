import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFeed } from './hooks/useFeed';
import { CardViewer } from './components/CardViewer';
import { SubjectFilter } from './components/SubjectFilter';
import { ProgressBar } from './components/ProgressBar';
import { ThemeToggle } from './components/ThemeToggle';
import type { Card, UserState } from './types/card';

export default function App() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [userState, setUserState] = useLocalStorage<UserState>('ds-user-state', {});
  const [isDark, setIsDark] = useLocalStorage('ds-dark-mode', true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load cards
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cards.json`)
      .then(res => res.json())
      .then((data: Card[]) => setAllCards(data))
      .catch(console.error);
  }, []);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.style.backgroundColor = isDark ? '#0a0a0a' : '#f5f5f5';
    document.body.style.color = isDark ? '#fff' : '#0a0a0a';
  }, [isDark]);

  // Search filter
  const searchedCards = useMemo(() => {
    if (!searchQuery.trim()) return allCards;
    const q = searchQuery.toLowerCase();
    return allCards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q)
    );
  }, [allCards, searchQuery]);

  // Get subjects
  const subjects = useMemo(() => {
    const set = new Set(allCards.map(c => c.subject));
    return Array.from(set).sort();
  }, [allCards]);

  // Feed algorithm
  const feed = useFeed({
    cards: searchedCards,
    userState,
    selectedSubject,
    showBookmarked,
  });

  // Actions
  const handleSeen = useCallback((id: string) => {
    setUserState(prev => ({
      ...prev,
      [id]: { ...prev[id], lastSeen: Date.now() },
    }));
  }, [setUserState]);

  const handleBookmark = useCallback((id: string) => {
    setUserState(prev => ({
      ...prev,
      [id]: { ...prev[id], bookmarked: !prev[id]?.bookmarked },
    }));
  }, [setUserState]);

  const handleLearn = useCallback((id: string) => {
    setUserState(prev => ({
      ...prev,
      [id]: { ...prev[id], learned: !prev[id]?.learned },
    }));
  }, [setUserState]);

  return (
    <div className={`h-full relative ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f5]'}`}>
      <SubjectFilter
        subjects={subjects}
        selected={selectedSubject}
        onSelect={setSelectedSubject}
        showBookmarked={showBookmarked}
        onToggleBookmarked={() => setShowBookmarked(prev => !prev)}
        onSearch={setSearchQuery}
      />

      <ThemeToggle
        isDark={isDark}
        onToggle={() => setIsDark(prev => !prev)}
      />

      <CardViewer
        cards={feed}
        userState={userState}
        onSeen={handleSeen}
        onBookmark={handleBookmark}
        onLearn={handleLearn}
      />

      <ProgressBar
        cards={allCards}
        userState={userState}
        selectedSubject={selectedSubject}
      />
    </div>
  );
}
