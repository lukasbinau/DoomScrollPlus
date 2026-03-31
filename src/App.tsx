import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFeed } from './hooks/useFeed';
import { CardViewer } from './components/CardViewer';
import { SideDrawer } from './components/SideDrawer';
import { InstallPrompt } from './components/InstallPrompt';
import { BrainrotPlayer } from './components/BrainrotPlayer';
import type { Card, UserState } from './types/card';

export default function App() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [userState, setUserState] = useLocalStorage<UserState>('ds-user-state', {});
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [brainrot, setBrainrot] = useLocalStorage<boolean>('ds-brainrot', false);

  // Load cards
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cards.json`)
      .then(res => res.json())
      .then((data: Card[]) => setAllCards(data))
      .catch(console.error);
  }, []);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#0a0a0a';
    document.body.style.color = '#fff';
  }, []);

  // Search filter
  const searchedCards = useMemo(() => {
    if (!searchQuery.trim()) return allCards;
    const q = searchQuery.toLowerCase();
    return allCards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.course.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q)
    );
  }, [allCards, searchQuery]);

  // Build course hierarchy for the drawer
  const courses = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const counts = new Map<string, number>();
    allCards.forEach(c => {
      if (!map.has(c.course)) map.set(c.course, new Set());
      map.get(c.course)!.add(c.subject);
      counts.set(c.course, (counts.get(c.course) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([course, subjectsSet]) => ({
        course,
        subjects: Array.from(subjectsSet).sort(),
        count: counts.get(course) || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allCards]);

  // Feed algorithm
  const feed = useFeed({
    cards: searchedCards,
    userState,
    selectedCourse,
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

  // Current filter label for the top bar
  const filterLabel = showBookmarked
    ? 'Saved'
    : selectedCourse
      ? selectedSubject
        ? `${selectedCourse} › ${selectedSubject}`
        : selectedCourse
      : 'All Cards';

  return (
    <div className={`h-full relative bg-[#0a0a0a] ${brainrot ? 'brainrot' : ''}`}>
      {/* Video area for brainrot mode */}
      {brainrot && (
        <div className="h-[40dvh] w-full relative z-0">
          <BrainrotPlayer />
        </div>
      )}

      {/* Hamburger menu button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className={`absolute ${brainrot ? 'top-[40dvh]' : 'top-3'} left-4 z-30 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-transform active:scale-90 safe-top mt-3`}
        aria-label="Open menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/70">
          <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Brainrot toggle button */}
      <button
        onClick={() => setBrainrot(prev => !prev)}
        className={`absolute ${brainrot ? 'top-[40dvh]' : 'top-3'} right-4 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 safe-top mt-3 ${brainrot ? 'bg-violet-500 shadow-lg shadow-violet-500/40' : 'bg-white/10'}`}
        aria-label="Toggle brainrot mode"
      >
        <span className="text-sm">🧠</span>
      </button>

      {/* Current filter label */}
      <div className={`absolute ${brainrot ? 'top-[40dvh]' : 'top-3'} left-14 z-30 safe-top mt-3.5`}>
        <span className="text-xs text-white/40 font-medium truncate max-w-[200px] block">{filterLabel}</span>
      </div>

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        courses={courses}
        selectedCourse={selectedCourse}
        selectedSubject={selectedSubject}
        showBookmarked={showBookmarked}
        onSelectCourse={setSelectedCourse}
        onSelectSubject={setSelectedSubject}
        onToggleBookmarked={() => setShowBookmarked(prev => !prev)}
        onSearch={setSearchQuery}
        allCards={allCards}
        userState={userState}
      />

      <CardViewer
        cards={feed}
        userState={userState}
        onSeen={handleSeen}
        onBookmark={handleBookmark}
        onLearn={handleLearn}
      />

      <InstallPrompt />
    </div>
  );
}
