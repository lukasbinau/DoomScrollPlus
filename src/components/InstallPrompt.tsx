import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Don't show if already dismissed
    const dismissed = localStorage.getItem('ds-install-dismissed');
    if (dismissed) return;

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isiOS = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;

    if (isiOS) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Android / Chrome — capture the browser's install event
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      await deferredPrompt.current.userChoice;
      deferredPrompt.current = null;
    }
    setShow(false);
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem('ds-install-dismissed', '1');
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-[#1a1a2e] rounded-2xl p-6 shadow-2xl border border-white/10">
        {/* App icon / branding */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            DS+
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">DoomScroll+</h2>
            <p className="text-white/50 text-xs">Study smarter, scroll better</p>
          </div>
        </div>

        {isIOS ? (
          <>
            <p className="text-white/70 text-sm mb-4">
              Install this app on your iPhone: tap{' '}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="inline w-4 h-4 text-violet-400 -mt-0.5">
                <path d="M11.47 1.72a.75.75 0 011.06 0l3 3a.75.75 0 11-1.06 1.06l-1.72-1.72V15a.75.75 0 01-1.5 0V4.06L9.53 5.78a.75.75 0 01-1.06-1.06l3-3z" />
                <path d="M3 15.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A2.25 2.25 0 006 18.75h12a2.25 2.25 0 002.25-2.25h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0121 15.75v3A3.75 3.75 0 0117.25 22.5H6.75A3.75 3.75 0 013 18.75v-3z" />
              </svg>{' '}
              <strong className="text-white">Share</strong> then{' '}
              <strong className="text-white">Add to Home Screen</strong>.
            </p>
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm active:scale-95 transition-transform"
            >
              Got it
            </button>
          </>
        ) : (
          <>
            <p className="text-white/70 text-sm mb-5">
              Add DoomScroll+ to your home screen for a full-screen, app-like experience with offline access.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/70 font-medium text-sm active:scale-95 transition-transform"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm active:scale-95 transition-transform shadow-lg shadow-violet-600/30"
              >
                Install
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
