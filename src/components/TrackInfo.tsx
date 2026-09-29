import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface TrackInfoProps {
  title?: string;
  artist?: string;
  elapsedSeconds: number;
  totalDuration: number;
  isPlaying: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({
  title = 'NUMO Radio',
  artist = '',
  elapsedSeconds,
  totalDuration,
  isPlaying,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPosRef = useRef(0);
  const posRef = useRef(0);
  const singleWidthRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Check if title text exceeds container width
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && measureRef.current) {
        const textWidth = measureRef.current.offsetWidth;
        const containerWidth = containerRef.current.clientWidth;
        const overflows = textWidth > containerWidth + 2;
        setIsOverflowing(overflows);
        if (overflows) {
          // 48px is the pr-12 spacer on each marquee item
          singleWidthRef.current = textWidth + 48;
        }
      }
    };

    // Check immediately and also in next tick after font renders
    checkOverflow();
    const timeout = setTimeout(checkOverflow, 50);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [title]);

  // Infinite seamless marquee animation loop
  useEffect(() => {
    if (!isOverflowing) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      posRef.current = 0;
      return;
    }

    posRef.current = 0;
    let lastTime = performance.now();
    const speed = 36; // px per second

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const w = singleWidthRef.current || (firstItemRef.current ? firstItemRef.current.offsetWidth : 0);
      if (w > 0) {
        singleWidthRef.current = w;

        if (!isDraggingRef.current) {
          posRef.current -= speed * dt;
          if (posRef.current <= -w) {
            posRef.current += w;
          }
          if (marqueeInnerRef.current) {
            marqueeInnerRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOverflowing, title]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isOverflowing) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartPosRef.current = posRef.current;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const w = singleWidthRef.current || (firstItemRef.current ? firstItemRef.current.offsetWidth : 0);
    if (w <= 0) return;

    const dx = e.clientX - dragStartXRef.current;
    let newPos = dragStartPosRef.current + dx;

    // Seamless modulo wrapping while dragging in either direction
    newPos = ((newPos % w) - w) % w;

    posRef.current = newPos;
    if (marqueeInnerRef.current) {
      marqueeInnerRef.current.style.transform = `translate3d(${newPos}px, 0, 0)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (elapsedSeconds / totalDuration) * 100))
    : 0;

  const displayTitle = title || 'SOLO Radio';

  return (
    <div className="w-full flex flex-col items-center text-center mt-1 sm:mt-1.5 mb-0 px-0">
      {/* Title with smooth Marquee (бігучий рядок) when overflowing */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden relative select-none py-1 px-1 cursor-grab active:cursor-grabbing touch-pan-y"
        style={
          isOverflowing
            ? {
                maskImage:
                  'linear-gradient(to right, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)',
              }
            : undefined
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Invisible measurement element to always get exact title width */}
        <span
          ref={measureRef}
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none whitespace-nowrap text-lg sm:text-xl font-extrabold tracking-tight font-sans left-0 top-0 -z-50"
        >
          {displayTitle}
        </span>

        {isOverflowing ? (
          <div
            ref={marqueeInnerRef}
            className="flex w-max will-change-transform"
            style={{ transform: 'translate3d(0, 0, 0)' }}
          >
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                ref={idx === 0 ? firstItemRef : undefined}
                className="inline-flex items-center text-lg sm:text-xl font-extrabold text-white tracking-tight whitespace-nowrap drop-shadow-sm font-sans pr-12 pointer-events-none"
                aria-hidden={idx > 0}
              >
                {displayTitle}
              </span>
            ))}
          </div>
        ) : (
          <h1
            ref={textRef}
            className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate drop-shadow-sm font-sans"
          >
            {displayTitle}
          </h1>
        )}
      </div>

      {/* Artist (if present) */}
      {artist && (
        <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5 truncate w-full px-1">
          {artist}
        </p>
      )}

      {/* Duration Bar & Timers */}
      <div className="w-full mt-1.5 px-1">
        {/* Progress track */}
        <div className="relative w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          {totalDuration > 0 ? (
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)]"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'linear' }}
            />
          ) : (
            <div className="w-full h-full bg-cyan-400/40 animate-pulse" />
          )}
        </div>

        {/* Timers Row without blinking SOLO text */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-1 px-0.5">
          <span>{totalDuration > 0 ? formatTime(elapsedSeconds) : '00:00'}</span>
          <span>
            {totalDuration > 0 ? formatTime(totalDuration) : '24/7'}
          </span>
        </div>
      </div>
    </div>
  );
};
