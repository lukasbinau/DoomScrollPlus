import { useState, useRef, useCallback, useEffect } from 'react';

interface ContentPopupProps {
  children: React.ReactNode;
}

export function ContentPopup({ children }: ContentPopupProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didOpen = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(() => {
    didOpen.current = false;
    timerRef.current = setTimeout(() => {
      setOpen(true);
      didOpen.current = true;
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handlePointerCancel = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  // Prevent click from propagating if we just opened the popup
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didOpen.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onClick={handleClick}
        className="relative cursor-pointer"
        style={{ touchAction: 'none' }}
      >
        {children}
        {/* Hold hint */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/50 text-[9px] text-white/40 pointer-events-none">
          Hold to expand
        </div>
      </div>

      {open && (
        <div
          className="content-popup-overlay"
          onClick={() => setOpen(false)}
        >
          <div
            className="content-popup-modal scrollable-touch"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors z-10"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="p-4 pt-2">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
