import { useRef, useEffect, useCallback, useState } from 'react';

const VIDEOS = [
  'subway-surfers-1.mp4',
  'subway-surfers-2.mp4',
  'subway-surfers-3.mp4',
  'neon-spiral.mp4',
  'colorful-swirls.mp4',
  'color-mixing.mp4',
  'ink-water.mp4',
  'abstract-paint.mp4',
  'liquid-art.mp4',
  'neon-glow.mp4',
];

export function BrainrotPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * VIDEOS.length));

  const nextVideo = useCallback(() => {
    setIndex(prev => (prev + 1) % VIDEOS.length);
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => {});
  }, [index]);

  const src = `${import.meta.env.BASE_URL}videos/${VIDEOS[index]}`;

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        muted
        playsInline
        loop={false}
        onEnded={nextVideo}
        className="w-full h-full object-cover"
      />
      {/* Subtle bottom gradient for visual separation */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </div>
  );
}
