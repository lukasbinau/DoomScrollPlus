import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ContentPopupProps {
  children: React.ReactNode;
  /** Content to render in the expanded modal. If omitted, children are reused. */
  popupContent?: React.ReactNode;
  /** If true, the wrapper and hint are hidden entirely (e.g. when ComplexityChart returns null) */
  hidden?: boolean;
  /** Enable pinch-to-zoom and drag inside the modal */
  zoomable?: boolean;
  /** Changes when the owning card becomes active so the hint animation can restart */
  animationKey?: string | number;
}

export function ContentPopup({ children, popupContent, hidden, zoomable, animationKey }: ContentPopupProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didOpen = useRef(false);

  // Pinch-zoom state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const pinchRef = useRef({ startDist: 0, startScale: 1 });
  const panRef = useRef({ startX: 0, startY: 0, startTx: 0, startTy: 0, fingers: 0 });

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

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didOpen.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  // Reset zoom when opening/closing
  useEffect(() => {
    if (open) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Touch handlers for pinch-zoom and drag inside modal
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!zoomable) return;
    panRef.current.fingers = e.touches.length;
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current.startDist = Math.hypot(dx, dy);
      pinchRef.current.startScale = scale;
    } else if (e.touches.length === 1) {
      panRef.current.startX = e.touches[0].clientX;
      panRef.current.startY = e.touches[0].clientY;
      panRef.current.startTx = translate.x;
      panRef.current.startTy = translate.y;
    }
  }, [zoomable, scale, translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!zoomable) return;
    e.stopPropagation();
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.max(0.5, Math.min(5, pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
      setScale(newScale);
    } else if (e.touches.length === 1 && panRef.current.fingers === 1) {
      const dx = e.touches[0].clientX - panRef.current.startX;
      const dy = e.touches[0].clientY - panRef.current.startY;
      setTranslate({ x: panRef.current.startTx + dx, y: panRef.current.startTy + dy });
    }
  }, [zoomable]);

  if (hidden) {
    return <>{children}</>;
  }

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
        <div key={animationKey ?? 'content-expand-hint'} className="content-expand-hint absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] text-white/55 pointer-events-none">
          Hold to expand
        </div>
      </div>

      {open && createPortal(
        <div
          className="content-popup-overlay"
          onClick={() => setOpen(false)}
        >
          <div
            className="content-popup-modal"
            onClick={e => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors z-10"
              aria-label="Close"
            >
              ✕
            </button>
            <div
              className="p-4 pt-2 overflow-hidden"
              style={zoomable ? { transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transformOrigin: 'center center' } : undefined}
            >
              {popupContent ?? children}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
