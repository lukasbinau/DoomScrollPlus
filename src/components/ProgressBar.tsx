import type { Card, UserState } from '../types/card';

interface Props {
  cards: Card[];
  userState: UserState;
  selectedCourse: string | null;
  selectedSubject: string | null;
}

export function ProgressBar({ cards, userState, selectedCourse, selectedSubject }: Props) {
  let filtered = cards;
  if (selectedCourse) filtered = filtered.filter(c => c.course === selectedCourse);
  if (selectedSubject) filtered = filtered.filter(c => c.subject === selectedSubject);

  const total = filtered.length;
  if (total === 0) return null;

  const learned = filtered.filter(c => userState[c.id]?.learned).length;
  const seen = filtered.filter(c => userState[c.id]?.lastSeen && !userState[c.id]?.learned).length;

  const learnedPct = Math.round((learned / total) * 100);
  const seenPct = Math.round((seen / total) * 100);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 safe-bottom">
      <div className="px-4 pb-3 pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-white/40">
            {learned} learned · {seen} seen · {total} total
          </span>
          <span className="text-[10px] text-white/40">
            {learnedPct + seenPct}%
          </span>
        </div>
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${learnedPct}%` }}
            />
            <div
              className="h-full bg-violet-500/50 transition-all duration-500"
              style={{ width: `${seenPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
