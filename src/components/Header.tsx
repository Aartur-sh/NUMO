import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Users, Globe, Moon } from 'lucide-react';
import type { Language } from '../i18n';
import { translations } from '../i18n';

interface HeaderProps {
  isOnline: boolean;
  isPlaying: boolean;
  listenersCount: number;
  lang: Language;
  onToggleLang: () => void;
  onOpenInfo: () => void;
  sleepMinutes: number;
  remainingSeconds: number;
  onStartSleepTimer: (mins: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  isPlaying,
  listenersCount,
  lang,
  onToggleLang,
  onOpenInfo,
  sleepMinutes,
  remainingSeconds,
  onStartSleepTimer,
}) => {
  const [showListenersBadge, setShowListenersBadge] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sleepMenuRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  const handleFirstOClick = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowListenersBadge(true);
    hideTimerRef.current = setTimeout(() => {
      setShowListenersBadge(false);
    }, 4000);
  };

  useEffect(() => {
    if (!showSleepMenu) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(e.target as Node)) {
        setShowSleepMenu(false);
      }
    };
    window.addEventListener('pointerdown', handleOutside);
    return () => window.removeEventListener('pointerdown', handleOutside);
  }, [showSleepMenu]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <header className="relative w-full flex items-center justify-between z-30 pt-1 pb-2">
      {/* Left: NUMO Brand with dynamic pulsing 'O' and Track History Button */}
      <div className="relative flex items-center gap-2">
        <div className="flex items-center select-none">
          {/* Letters N, U, M with Animated Waving Ukrainian Flag Wave dividing blue & yellow */}
          <div className="relative flex items-center h-6 sm:h-7">
            <svg
              viewBox="0 0 54 26"
              className="h-6 sm:h-7 w-auto select-none pointer-events-none drop-shadow-[0_2px_6px_rgba(0,87,183,0.4)]"
            >
              <defs>
                <clipPath id="numHeaderClip">
                  <text
                    x="0"
                    y="22"
                    fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                    fontWeight="900"
                    fontSize="25"
                    letterSpacing="-0.8"
                  >
                    NUM
                  </text>
                </clipPath>
                <filter id="numSoftBlend">
                  <feGaussianBlur stdDeviation="1.2" />
                </filter>
                <linearGradient id="headerBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0057b7" />
                  <stop offset="50%" stopColor="#0077e6" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="headerGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffd700" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>

              <g clipPath="url(#numHeaderClip)">
                {/* Sky blue upper half */}
                <rect x="0" y="0" width="54" height="26" fill="url(#headerBlue)" />
                {/* Golden lower half with undulating sine wave dividing line */}
                <path
                  className="animate-flag-wave"
                  fill="url(#headerGold)"
                  d="M -81 12.5 Q -67.5 8, -54 12.5 T -27 12.5 Q -13.5 8, 0 12.5 T 27 12.5 Q 40.5 8, 54 12.5 T 81 12.5 Q 94.5 8, 108 12.5 T 135 12.5 L 135 30 L -81 30 Z"
                />
                {/* Soft Gaussian blur transition band along the wave for smooth color blending */}
                <path
                  className="animate-flag-wave"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  fill="none"
                  opacity="0.5"
                  filter="url(#numSoftBlend)"
                  d="M -81 12.5 Q -67.5 8, -54 12.5 T -27 12.5 Q -13.5 8, 0 12.5 T 27 12.5 Q 40.5 8, 54 12.5 T 81 12.5 Q 94.5 8, 108 12.5 T 135 12.5"
                />
              </g>
            </svg>
          </div>

          {/* Interactive Last 'O' */}
          <button
            type="button"
            onClick={handleFirstOClick}
            aria-label="Показати кількість онлайн слухачів"
            className="group relative ml-1 sm:ml-1.5 flex items-center justify-center rounded-full focus:outline-none transition-transform active:scale-90 cursor-pointer"
          >
            {/* Ambient ripple/aura when online and playing */}
            {isOnline && isPlaying && (
              <>
                <span className="absolute -inset-1 rounded-full bg-cyan-400/25 animate-ping opacity-75" />
                <span className="absolute -inset-1.5 rounded-full bg-blue-500/15 animate-pulse" />
              </>
            )}

            {/* Glowing Orb / Ring representing the letter 'O' - matching height (22px / 26px) */}
            <div
              className={`relative flex items-center justify-center w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-full border-2 transition-all duration-500 ${
                !isOnline
                  ? 'border-red-500/60 bg-red-950/30 text-red-400'
                  : isPlaying
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.7)] animate-pulse'
                  : 'border-amber-400 bg-amber-950/40 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.55)]'
              }`}
            >
              {/* Inner core dot / frequency pulse */}
              <div
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                  !isOnline
                    ? 'bg-red-500'
                    : isPlaying
                    ? 'bg-gradient-to-tr from-cyan-400 to-sky-200 animate-ping'
                    : 'bg-gradient-to-tr from-amber-400 to-orange-400'
                }`}
              />
              {/* Subtle inner ring */}
              <div className="absolute inset-0.5 rounded-full border border-current opacity-40" />
            </div>
          </button>
        </div>

        {/* Listeners Count Popover Badge */}
        <AnimatePresence>
          {showListenersBadge && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.88, transition: { duration: 0.6, ease: 'easeOut' } }}
              transition={{ type: 'spring', damping: 20, stiffness: 320 }}
              className="absolute left-6 top-10 sm:top-11 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/98 backdrop-blur-2xl border border-cyan-400/40 text-white shadow-xl shadow-cyan-950/80 pointer-events-none whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="text-xs font-bold text-cyan-200">
                {listenersCount} {listenersCount === 1 ? t.listener : listenersCount > 1 && listenersCount < 5 ? t.listenersFew : t.listeners}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Action Buttons: Sleep Timer, Language & Info */}
      <div className="flex items-center gap-2">
        {/* Sleep Timer Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSleepMenu((prev) => !prev)}
            aria-label={t.sleepTimer}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md border transition-all cursor-pointer active:scale-90 shadow-sm touch-manipulation ${
              remainingSeconds > 0
                ? 'bg-indigo-600/40 border-indigo-400/60 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                : 'bg-white/10 border-white/10 text-slate-200 hover:text-white hover:bg-white/15'
            }`}
          >
            <Moon className={`w-4 h-4 ${remainingSeconds > 0 ? 'animate-pulse text-indigo-300' : ''}`} />
            {remainingSeconds > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.5 rounded-full bg-indigo-500 text-white font-mono font-bold text-[8px] shadow-md">
                {Math.floor(remainingSeconds / 60)}m
              </span>
            )}
          </button>

          {/* Sleep Timer Menu Popover */}
          <AnimatePresence>
            {showSleepMenu && (
              <motion.div
                ref={sleepMenuRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 top-12 z-50 w-48 p-2 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/90 flex flex-col gap-1"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.sleepTimer}</span>
                </div>
                {[0, 15, 30, 45, 60, 90].map((mins) => {
                  const isActive = sleepMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        onStartSleepTimer(mins);
                        setShowSleepMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-400/30'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{mins === 0 ? t.sleepOff : `${mins} ${t.mins}`}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onToggleLang}
          type="button"
          aria-label="Змінити мову / Change language"
          className="flex items-center gap-1 px-3 h-10 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all shadow-sm cursor-pointer text-xs font-bold tracking-wider touch-manipulation"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang.toUpperCase()}</span>
        </button>

        <button
          onClick={onOpenInfo}
          type="button"
          aria-label="Інформація про радіо"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all shadow-sm cursor-pointer touch-manipulation z-30"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
