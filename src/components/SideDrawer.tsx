import { useState, useMemo } from 'react';
import type { Card, UserState } from '../types/card';

interface CourseData {
  course: string;
  subjects: string[];
  count: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseData[];
  selectedCourse: string | null;
  selectedSubject: string | null;
  showBookmarked: boolean;
  onSelectCourse: (course: string | null) => void;
  onSelectSubject: (subject: string | null) => void;
  onToggleBookmarked: () => void;
  onSearch: (query: string) => void;
  allCards: Card[];
  userState: UserState;
}

export function SideDrawer({
  isOpen,
  onClose,
  courses,
  selectedCourse,
  selectedSubject,
  showBookmarked,
  onSelectCourse,
  onSelectSubject,
  onToggleBookmarked,
  onSearch,
  allCards,
  userState,
}: Props) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(selectedCourse);
  const [query, setQuery] = useState('');

  // Progress stats
  const progress = useMemo(() => {
    let filtered = allCards;
    if (selectedCourse) filtered = filtered.filter(c => c.course === selectedCourse);
    if (selectedSubject) filtered = filtered.filter(c => c.subject === selectedSubject);
    const total = filtered.length;
    const learned = filtered.filter(c => userState[c.id]?.learned).length;
    const seen = filtered.filter(c => userState[c.id]?.lastSeen && !userState[c.id]?.learned).length;
    return { total, learned, seen };
  }, [allCards, userState, selectedCourse, selectedSubject]);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleSelectAll = () => {
    onSelectCourse(null);
    onSelectSubject(null);
    if (showBookmarked) onToggleBookmarked();
    onClose();
  };

  const handleSelectCourse = (course: string) => {
    if (expandedCourse === course) {
      // Already expanded — collapse it
      setExpandedCourse(null);
    } else {
      setExpandedCourse(course);
    }
  };

  const handleSelectSubject = (course: string, subject: string) => {
    onSelectCourse(course);
    onSelectSubject(subject);
    if (showBookmarked) onToggleBookmarked();
    onClose();
  };

  const handleBookmarked = () => {
    onToggleBookmarked();
    onSelectCourse(null);
    onSelectSubject(null);
    onClose();
  };

  const isAllActive = !selectedCourse && !selectedSubject && !showBookmarked;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#111] border-r border-white/10 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full safe-top safe-bottom">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">Courses</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/60">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search cards..."
              className="w-full px-3 py-2 text-sm bg-white/5 rounded-lg text-white placeholder-white/30 outline-none border border-white/10 focus:border-violet-500/50"
            />
          </div>

          {/* Course list */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* All cards */}
            <button
              onClick={handleSelectAll}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                isAllActive ? 'bg-violet-500/20 text-white' : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isAllActive ? 'bg-violet-500' : 'bg-white/20'}`} />
              <span className="text-sm font-medium">All Cards</span>
            </button>

            {/* Saved / bookmarked */}
            <button
              onClick={handleBookmarked}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                showBookmarked ? 'bg-violet-500/20 text-white' : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={showBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className={`w-4 h-4 ${showBookmarked ? 'text-violet-400' : 'text-white/30'}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              <span className="text-sm font-medium">Saved</span>
            </button>

            <div className="h-px bg-white/5 my-1" />

            {/* Courses */}
            {courses.map(({ course, subjects, count }) => {
              const isExpanded = expandedCourse === course;
              const isCourseActive = selectedCourse === course && !selectedSubject && !showBookmarked;

              return (
                <div key={course}>
                  <button
                    onClick={() => handleSelectCourse(course)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                      isCourseActive ? 'bg-violet-500/20 text-white' : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Expand arrow */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${isCourseActive ? 'text-violet-400' : 'text-white/30'}`}
                      >
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium truncate">{course}</span>
                    </div>
                    <span className="text-xs text-white/30 flex-shrink-0 ml-2">{count}</span>
                  </button>

                  {/* Subjects (sub-categories) */}
                  {isExpanded && (
                    <div className="bg-white/[0.02]">
                      {/* "All in course" option */}
                      <button
                        onClick={() => { onSelectCourse(course); onSelectSubject(null); if (showBookmarked) onToggleBookmarked(); onClose(); }}
                        className={`w-full text-left pl-11 pr-4 py-2.5 flex items-center gap-2 transition-colors ${
                          isCourseActive ? 'text-violet-400' : 'text-white/50 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xs">All {course}</span>
                      </button>

                      {subjects.map(subject => {
                        const isSubjectActive = selectedCourse === course && selectedSubject === subject && !showBookmarked;
                        return (
                          <button
                            key={subject}
                            onClick={() => handleSelectSubject(course, subject)}
                            className={`w-full text-left pl-11 pr-4 py-2.5 flex items-center gap-2 transition-colors ${
                              isSubjectActive ? 'bg-violet-500/20 text-violet-400' : 'text-white/50 hover:bg-white/5'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${isSubjectActive ? 'bg-violet-400' : 'bg-white/20'}`} />
                            <span className="text-xs">{subject}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress footer */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-white/40">
                {progress.learned} learned · {progress.seen} seen · {progress.total} total
              </span>
              <span className="text-[10px] text-white/40">
                {progress.total > 0 ? Math.round(((progress.learned + progress.seen) / progress.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: progress.total > 0 ? `${(progress.learned / progress.total) * 100}%` : '0%' }}
                />
                <div
                  className="h-full bg-violet-500/50 transition-all duration-500"
                  style={{ width: progress.total > 0 ? `${(progress.seen / progress.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
