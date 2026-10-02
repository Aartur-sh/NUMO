import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, Volume1, VolumeX, Loader2, ListMusic, Sparkles } from 'lucide-react';
import type { Language } from '../i18n';
import { translations } from '../i18n';

interface ControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onPause: () => void;
  onSetVolume: (val: number) => void;
  onToggleMute: () => void;
  onOpenHistory?: () => void;
  bitrate?: number;
  lang?: Language;
}

// 10 discrete volume notches matching the exact track progress gradient (Cyan -> Sky -> Indigo):
// Free of orange and yellow, in complete harmony with the track progress bar
const VOLUME_NOTCH_COLORS = [
  { bg: 'from-cyan-400 to-cyan-300', glow: 'rgba(34,211,238,0.75)' },
  { bg: 'from-cyan-400 to-sky-400', glow: 'rgba(34,211,238,0.75)' },
  { bg: 'from-cyan-400 to-sky-400', glow: 'rgba(56,189,248,0.75)' },
  { bg: 'from-sky-400 to-sky-300', glow: 'rgba(56,189,248,0.75)' },
  { bg: 'from-sky-400 to-blue-400', glow: 'rgba(56,189,248,0.75)' },
  { bg: 'from-sky-400 to-blue-500', glow: 'rgba(59,130,246,0.75)' },
  { bg: 'from-blue-500 to-indigo-400', glow: 'rgba(99,102,241,0.75)' },
  { bg: 'from-blue-500 to-indigo-500', glow: 'rgba(99,102,241,0.8)' },
  { bg: 'from-indigo-500 to-indigo-400', glow: 'rgba(129,140,248,0.85)' },
  { bg: 'from-indigo-400 to-indigo-300', glow: 'rgba(129,140,248,0.9)' },
];

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  isLoading,
  isBuffering,
  volume,
  isMuted,
  onTogglePlay,
  onSetVolume,
  onToggleMute,
  onOpenHistory,
  lang = 'uk',
}) => {
  const t = translations[lang];
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [_isDraggingTrack, setIsDraggingTrack] = useState(false);
  const [showDevToast, setShowDevToast] = useState(false);
  const devToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHistoryClick = () => {
    if (devToastTimerRef.current) {
      clearTimeout(devToastTimerRef.current);
    }
    setShowDevToast(true);
    devToastTimerRef.current = setTimeout(() => {
      setShowDevToast(false);
    }, 2200);

    onOpenHistory?.();
  };

  useEffect(() => {
    return () => {
      if (devToastTimerRef.current) {
        clearTimeout(devToastTimerRef.current);
      }
    };
  }, []);

  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingVolumeRef = useRef(false);

  const effectiveVolume = isMuted ? 0 : volume;
  // Convert volume (0.0 - 1.0) to 10 discrete steps (0 to 10)
  const targetStep = Math.round(effectiveVolume * 10);
  const [displayStep, setDisplayStep] = useState(targetStep);

  // Smooth cascading step animation when muting/unmuting or when targetStep changes
  useEffect(() => {
    if (isDraggingVolumeRef.current) {
      setDisplayStep(targetStep);
      return;
    }

    const timer = setInterval(() => {
      setDisplayStep((prev) => {
        if (prev < targetStep) return prev + 1;
        if (prev > targetStep) return prev - 1;
        clearInterval(timer);
        return prev;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [targetStep]);

  // Reset or start the 5-second volume auto-hide countdown
  const resetAutoHideTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 5000);
  };

  const handleVolumeButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowVolumeSlider((prev) => {
      const nextState = !prev;
      if (nextState) {
        resetAutoHideTimer();
      } else if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
      return nextState;
    });
  };

  const handleSliderInteraction = () => {
    resetAutoHideTimer();
  };

  // Exactly 10 steps of volume (0.0, 0.1, 0.2 ... 1.0)
  const updateVolumeFromClientY = (clientY: number) => {
    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const height = rect.height;
    if (height <= 0) return;
    const offsetY = rect.bottom - clientY;
    const rawRatio = offsetY / height;
    const clamped = Math.max(0, Math.min(1, rawRatio));
    // Snap to 10 discrete levels
    const snapped = Math.round(clamped * 10) / 10;
    setDisplayStep(Math.round(snapped * 10));
    onSetVolume(snapped);
  };

  const handlePointerDownTrack = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resetAutoHideTimer();
    isDraggingVolumeRef.current = true;
    setIsDraggingTrack(true);
    updateVolumeFromClientY(e.clientY);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMoveTrack = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVolumeRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    resetAutoHideTimer();
    updateVolumeFromClientY(e.clientY);
  };

  const handlePointerUpTrack = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVolumeRef.current) return;
    isDraggingVolumeRef.current = false;
    setIsDraggingTrack(false);
    resetAutoHideTimer();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Close when tapping anywhere else on the screen
  useEffect(() => {
    if (!showVolumeSlider) return;

    const handleWindowTap = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowVolumeSlider(false);
      }
    };

    window.addEventListener('pointerdown', handleWindowTap);
    return () => {
      window.removeEventListener('pointerdown', handleWindowTap);
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [showVolumeSlider]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md my-1 px-4 flex flex-col items-center">
      {/* Main Controls Row with Absolute Center Alignment */}
      <div className="relative w-full flex items-center justify-between">
        
        {/* Left Side: Track History Button with Anchored 'В розробці' Toast */}
        <div className="relative flex items-center justify-start flex-shrink-0 z-20">
          <button
            type="button"
            onClick={handleHistoryClick}
            aria-label="Історія треків"
            title="Переглянути історію ефіру"
            className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center backdrop-blur-xl border bg-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/40 border-white/10 text-cyan-300 shadow-black/40 shadow-lg transition-all active:scale-90 cursor-pointer select-none group"
          >
            <ListMusic className="w-5 h-5 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
          </button>

          {/* Floating 'В розробці' Banner anchored directly ABOVE this button (smooth Pop!_OS glass, no jump glitch) */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none whitespace-nowrap">
            <AnimatePresence>
              {showDevToast && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{
                    opacity: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                    y: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                    scale: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0d121f]/75 backdrop-blur-2xl border border-white/20 text-cyan-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_12px_32px_rgba(0,0,0,0.85)] text-xs font-medium select-none"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse flex-shrink-0" />
                  <span className="tracking-wide">{lang === 'en' ? 'In development' : 'В розробці'}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Play/Pause Button positioned EXACTLY in the dead horizontal center */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
          {/* Ambient energetic glow when active */}
          <div
            className={`absolute -inset-2 rounded-full transition-opacity duration-700 pointer-events-none ${
              isPlaying
                ? 'opacity-60 blur-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 animate-pulse'
                : 'opacity-0'
            }`}
          />

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            onClick={onTogglePlay}
            type="button"
            aria-label={isPlaying ? 'Зупинити радіо' : 'Увімкнути радіо'}
            className="relative flex items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-[28px] sm:rounded-[32px] text-slate-950 ring-4 ring-cyan-400/30 overflow-hidden cursor-pointer shadow-2xl select-none"
          >
            {/* Layer 1: Playing Gradient (Cool Cyan/Indigo) */}
            <div
              className={`absolute inset-0 bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 transition-opacity duration-500 ease-in-out ${
                isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Layer 2: Paused Gradient (Warm Amber/Rose) */}
            <div
              className={`absolute inset-0 bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 transition-opacity duration-500 ease-in-out ${
                isPlaying ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Overlapping Morphed Icons with Zero Flicker */}
            <div className="relative w-10 h-10 flex items-center justify-center pointer-events-none">
              {/* Pause Icon */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-slate-950"
                animate={{
                  opacity: isPlaying && !isLoading && !isBuffering ? 1 : 0,
                  scale: isPlaying && !isLoading && !isBuffering ? 1 : 0.5,
                  rotate: isPlaying ? 0 : -35,
                }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <Pause className="w-9 h-9 fill-current stroke-none" />
              </motion.div>

              {/* Play Icon */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-slate-950 translate-x-0.5"
                animate={{
                  opacity: !isPlaying && !isLoading && !isBuffering ? 1 : 0,
                  scale: !isPlaying && !isLoading && !isBuffering ? 1 : 0.5,
                  rotate: !isPlaying ? 0 : 35,
                }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <Play className="w-9 h-9 fill-current stroke-none" />
              </motion.div>

              {/* Buffer / Loading Spinner */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-slate-950"
                animate={{
                  opacity: isLoading || isBuffering ? 1 : 0,
                  scale: isLoading || isBuffering ? 1 : 0.5,
                }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="w-9 h-9 animate-spin" />
              </motion.div>
            </div>
          </motion.button>
        </div>

        {/* Right Side: Volume Button Enlarged by 25% (60px x 60px) + 10-Level Discrete Slider */}
        <div className="relative flex items-center justify-end w-[60px] flex-shrink-0 z-30">
          <motion.div
            animate={{
              height: showVolumeSlider ? 210 : 60,
            }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            onPointerDown={handleSliderInteraction}
            className={`absolute bottom-0 right-0 z-50 flex flex-col items-center justify-end overflow-hidden backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/80 w-[60px] select-none transition-colors ${
              showVolumeSlider
                ? 'bg-white/15 border-white/25 text-white'
                : 'bg-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/40 border-white/10 text-cyan-300 shadow-black/40 shadow-lg'
            }`}
          >
            {/* Upper 10-Level Discrete Slider Zone (Equal distance to top edge & speaker icon: 24px) */}
            <div
              onPointerDown={showVolumeSlider ? handlePointerDownTrack : undefined}
              onPointerMove={showVolumeSlider ? handlePointerMoveTrack : undefined}
              onPointerUp={showVolumeSlider ? handlePointerUpTrack : undefined}
              onPointerCancel={showVolumeSlider ? handlePointerUpTrack : undefined}
              className={`w-full h-[150px] flex-shrink-0 flex flex-col items-center justify-start pt-6 cursor-pointer touch-none select-none relative ${
                showVolumeSlider ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              {/* 10 Discrete Level Notches Container (Height 120px, exactly 24px from top edge and 24px from speaker icon) */}
              <div
                ref={sliderTrackRef}
                className="relative w-8 h-[120px] flex flex-col-reverse justify-between items-center py-0 cursor-pointer"
              >
                {Array.from({ length: 10 }).map((_, idx) => {
                  const stepNum = idx + 1;
                  const isActive = displayStep >= stepNum;
                  const notch = VOLUME_NOTCH_COLORS[idx];
                  return (
                    <div
                      key={stepNum}
                      className={`w-6 h-2 rounded-[2px] transition-[opacity,box-shadow,background] duration-100 ease-out ${
                        isActive
                          ? `bg-gradient-to-r ${notch.bg} shadow-[0_0_8px_${notch.glow}] opacity-100`
                          : 'bg-white/15 opacity-25 shadow-none'
                      }`}
                    />
                  );
                })}
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={effectiveVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDisplayStep(Math.round(val * 10));
                  onSetVolume(val);
                  resetAutoHideTimer();
                }}
                aria-label="Гучність (10 рівнів)"
                className="sr-only"
              />
            </div>

            {/* Permanent 60px Speaker Button at base (+25% enlarged from 48px) */}
            <button
              type="button"
              onClick={(e) => {
                if (showVolumeSlider) {
                  onToggleMute();
                  resetAutoHideTimer();
                } else {
                  handleVolumeButtonClick(e);
                }
              }}
              aria-label="Налаштування гучності"
              className="w-[60px] h-[60px] flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-95 transition-all z-20"
            >
              {displayStep === 0 ? (
                <VolumeX className="w-6 h-6 text-red-300" />
              ) : displayStep < 5 ? (
                <Volume1 className="w-6 h-6 text-cyan-300" />
              ) : (
                <Volume2 className="w-6 h-6 text-cyan-300" />
              )}
            </button>
          </motion.div>

          {/* Symmetrical placeholder for 60px button */}
          <div className="w-[60px] h-[60px] opacity-0 pointer-events-none" />
        </div>

      </div>
    </div>
  );
};
