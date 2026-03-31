import { useState } from 'react';

interface Props {
  subjects: string[];
  selected: string | null;
  onSelect: (subject: string | null) => void;
  showBookmarked: boolean;
  onToggleBookmarked: () => void;
  onSearch: (query: string) => void;
}

export function SubjectFilter({ subjects, selected, onSelect, showBookmarked, onToggleBookmarked, onSearch }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-20 safe-top">
      <div className="px-4 pt-3 pb-2">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search cards..."
              autoFocus
              className="flex-1 px-4 py-2 text-sm bg-white/10 rounded-full text-white placeholder-white/40 outline-none border border-white/10 focus:border-violet-500/50"
            />
            <button
              onClick={() => { setSearchOpen(false); handleSearch(''); }}
              className="text-white/50 text-sm px-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {/* Search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/60">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </button>

            {/* All filter */}
            <button
              onClick={() => { onSelect(null); if (showBookmarked) onToggleBookmarked(); }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selected && !showBookmarked
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              All
            </button>

            {/* Subject pills */}
            {subjects.map(subject => (
              <button
                key={subject}
                onClick={() => { onSelect(subject === selected ? null : subject); if (showBookmarked) onToggleBookmarked(); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  subject === selected && !showBookmarked
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {subject}
              </button>
            ))}

            {/* Bookmarks filter */}
            <button
              onClick={() => { onToggleBookmarked(); onSelect(null); }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                showBookmarked
                  ? 'bg-violet-500 text-white'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              ♥ Saved
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
