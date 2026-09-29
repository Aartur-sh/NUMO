import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio } from 'lucide-react';

interface ArtworkProps {
  artUrl?: string;
  songTitle?: string;
  artistName?: string;
  isPlaying: boolean;
  isBuffering: boolean;
}

// 28 dynamic frequency filaments curated in NUMO cool signature palette:
// Deep Cyan -> Electric Sky -> Vibrant Blue -> Radiant Indigo -> Violet -> Soft Teal
const STUDIO_SPECTRUM_BARS = [
  // 1. Neon Cyan
  { bg: 'from-cyan-400 via-sky-300 to-teal-200', glow: 'rgba(34,211,238,0.7)', anim: 'eqMove1', d: '3.45s', delay: '-0.32s' },
  { bg: 'from-cyan-500 via-sky-400 to-cyan-200', glow: 'rgba(56,189,248,0.7)', anim: 'eqMove3', d: '4.22s', delay: '-0.88s' },
  { bg: 'from-cyan-400 via-teal-300 to-sky-200', glow: 'rgba(34,211,238,0.7)', anim: 'eqMove2', d: '3.14s', delay: '-0.15s' },
  { bg: 'from-sky-500 via-cyan-400 to-sky-200', glow: 'rgba(56,189,248,0.7)', anim: 'eqMove5', d: '3.98s', delay: '-0.95s' },

  // 2. Electric Sky & Royal Blue
  { bg: 'from-sky-500 via-blue-400 to-cyan-200', glow: 'rgba(59,130,246,0.7)', anim: 'eqMove4', d: '4.65s', delay: '-0.52s' },
  { bg: 'from-blue-500 via-sky-400 to-cyan-200', glow: 'rgba(56,189,248,0.7)', anim: 'eqMove1', d: '3.32s', delay: '-1.15s' },
  { bg: 'from-blue-600 via-indigo-400 to-sky-200', glow: 'rgba(99,102,241,0.7)', anim: 'eqMove2', d: '4.15s', delay: '-0.70s' },
  { bg: 'from-blue-500 via-indigo-400 to-cyan-300', glow: 'rgba(59,130,246,0.7)', anim: 'eqMove5', d: '3.05s', delay: '-0.48s' },

  // 3. Deep Indigo & Violet Flow
  { bg: 'from-indigo-500 via-violet-400 to-sky-200', glow: 'rgba(129,140,248,0.7)', anim: 'eqMove3', d: '4.52s', delay: '-1.42s' },
  { bg: 'from-indigo-600 via-purple-400 to-indigo-200', glow: 'rgba(168,85,247,0.7)', anim: 'eqMove2', d: '3.50s', delay: '-0.28s' },
  { bg: 'from-violet-500 via-purple-400 to-sky-200', glow: 'rgba(147,51,234,0.7)', anim: 'eqMove4', d: '4.48s', delay: '-0.90s' },
  { bg: 'from-purple-500 via-indigo-400 to-cyan-200', glow: 'rgba(129,140,248,0.7)', anim: 'eqMove1', d: '3.82s', delay: '-0.65s' },

  // 4. Center Peak Resonance
  { bg: 'from-indigo-400 via-sky-300 to-white', glow: 'rgba(129,140,248,0.85)', anim: 'eqMove5', d: '3.28s', delay: '-1.10s' },
  { bg: 'from-sky-400 via-cyan-300 to-white', glow: 'rgba(34,211,238,0.9)', anim: 'eqMove2', d: '4.18s', delay: '-0.35s' },
  { bg: 'from-cyan-400 via-sky-300 to-white', glow: 'rgba(34,211,238,0.9)', anim: 'eqMove3', d: '3.08s', delay: '-0.75s' },
  { bg: 'from-indigo-400 via-violet-300 to-white', glow: 'rgba(129,140,248,0.85)', anim: 'eqMove1', d: '3.88s', delay: '-0.12s' },

  // 5. High-Mids
  { bg: 'from-purple-500 via-indigo-400 to-cyan-200', glow: 'rgba(129,140,248,0.7)', anim: 'eqMove4', d: '4.80s', delay: '-1.08s' },
  { bg: 'from-indigo-500 via-sky-400 to-teal-200', glow: 'rgba(56,189,248,0.7)', anim: 'eqMove2', d: '3.38s', delay: '-0.58s' },
  { bg: 'from-sky-500 via-blue-400 to-cyan-200', glow: 'rgba(59,130,246,0.7)', anim: 'eqMove5', d: '3.68s', delay: '-1.30s' },
  { bg: 'from-blue-500 via-cyan-400 to-sky-200', glow: 'rgba(34,211,238,0.7)', anim: 'eqMove1', d: '3.15s', delay: '-0.20s' },

  // 6. Treble & Air Crests
  { bg: 'from-cyan-500 via-sky-400 to-teal-200', glow: 'rgba(34,211,238,0.7)', anim: 'eqMove3', d: '4.38s', delay: '-0.92s' },
  { bg: 'from-teal-500 via-cyan-400 to-sky-200', glow: 'rgba(45,212,191,0.7)', anim: 'eqMove2', d: '3.52s', delay: '-0.40s' },
  { bg: 'from-sky-500 via-cyan-400 to-indigo-300', glow: 'rgba(56,189,248,0.7)', anim: 'eqMove4', d: '4.62s', delay: '-1.12s' },
  { bg: 'from-cyan-400 via-sky-300 to-white', glow: 'rgba(34,211,238,0.85)', anim: 'eqMove1', d: '3.85s', delay: '-0.17s' },
  { bg: 'from-sky-400 via-teal-300 to-cyan-100', glow: 'rgba(34,211,238,0.7)', anim: 'eqMove3', d: '4.05s', delay: '-0.73s' },
  { bg: 'from-blue-500 via-sky-300 to-white', glow: 'rgba(56,189,248,0.7)', anim: 'eqMove2', d: '3.20s', delay: '-0.37s' },
  { bg: 'from-cyan-500 via-sky-400 to-teal-200', glow: 'rgba(34,211,238,0.7)', anim: 'eqMove5', d: '3.70s', delay: '-1.06s' },
  { bg: 'from-indigo-500 via-cyan-400 to-sky-200', glow: 'rgba(99,102,241,0.7)', anim: 'eqMove1', d: '3.50s', delay: '-0.19s' },
];

/**
 * Mathematically Tiling Infinite Sine Wave Laser Oscilloscope:
 * 100% seamless, unbroken, continuous motion without any jumps or restarts!
 */
const LaserOscilloscope: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  return (
    <div className="w-full h-9 relative overflow-hidden flex items-center justify-center pointer-events-none select-none">
      {/* Wave 1: Electric Cyan Laser (Mathematically seamless 800px period x 2) */}
      <div
        className={`absolute top-0 bottom-0 left-0 flex items-center ${
          isPlaying ? 'animate-wave-flow-1 opacity-95' : 'opacity-40'
        }`}
        style={{ width: '1600px' }}
      >
        <svg viewBox="0 0 1600 40" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M 0 20 Q 50 4, 100 20 T 200 20 Q 250 4, 300 20 T 400 20 Q 450 4, 500 20 T 600 20 Q 650 4, 700 20 T 800 20 Q 850 4, 900 20 T 1000 20 Q 1050 4, 1100 20 T 1200 20 Q 1250 4, 1300 20 T 1400 20 Q 1450 4, 1500 20 T 1600 20"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.2"
            className="drop-shadow-[0_0_8px_rgba(34,211,238,0.95)]"
          />
        </svg>
      </div>

      {/* Wave 2: Deep Indigo Laser Counter-Motion (Mathematically seamless 800px period x 2) */}
      <div
        className={`absolute top-0 bottom-0 left-0 flex items-center ${
          isPlaying ? 'animate-wave-flow-2 opacity-85' : 'opacity-30'
        }`}
        style={{ width: '1600px' }}
      >
        <svg viewBox="0 0 1600 40" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M 0 20 Q 50 36, 100 20 T 200 20 Q 250 36, 300 20 T 400 20 Q 450 36, 500 20 T 600 20 Q 650 36, 700 20 T 800 20 Q 850 36, 900 20 T 1000 20 Q 1050 36, 1100 20 T 1200 20 Q 1250 36, 1300 20 T 1400 20 Q 1450 36, 1500 20 T 1600 20"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
            className="drop-shadow-[0_0_8px_rgba(129,140,248,0.9)]"
          />
        </svg>
      </div>

      {/* Central Soft Luminous Core */}
      <div
        className={`w-36 h-4 rounded-full bg-cyan-400/20 blur-md pointer-events-none transition-opacity ${
          isPlaying ? 'opacity-100 animate-pulse' : 'opacity-20'
        }`}
      />
    </div>
  );
};

/**
 * Minimalist Bang & Olufsen / Braun Style High-End Turntable Player Deck:
 * - Brushed midnight titanium chassis with chamfered silver bezel
 * - Precision-milled silver aluminum platter
 * - Obsidian grooved black vinyl record with handwritten silver marker script "NUMO Radio" (2 bold lines)
 * - Ultra-sleek minimalist linear silver tonearm with glowing cyan cartridge tip
 */
const VinylTurntablePlayer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  return (
    <div className="relative w-full h-full bg-[#05070f] flex items-center justify-center p-3 sm:p-4 select-none overflow-hidden">
      {/* 1. Master Minimalist Midnight Titanium Chassis */}
      <div className="absolute inset-2 sm:inset-3 rounded-[28px] sm:rounded-[36px] border border-slate-700/80 bg-gradient-to-br from-[#1a2030] via-[#0d111d] to-[#04060c] shadow-[inset_0_2px_20px_rgba(0,0,0,0.95)] pointer-events-none" />

      {/* Thin Silver Anodized Inner Frame */}
      <div className="absolute inset-3.5 sm:inset-4 rounded-[22px] sm:rounded-[30px] border border-white/10 bg-gradient-to-tr from-slate-900/60 via-slate-800/10 to-slate-900/40 pointer-events-none" />

      {/* Minimalist Power Indicator Dot in Top-Left */}
      <div className="absolute top-6 left-7 z-10 pointer-events-none flex items-center gap-2">
        <div className="relative w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 via-slate-500 to-slate-800 border border-slate-300/60 shadow-md flex items-center justify-center">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              isPlaying ? 'bg-cyan-300 shadow-[0_0_12px_#22d3ee]' : 'bg-slate-700'
            }`}
          />
        </div>
        {isPlaying && (
          <div
            className="absolute top-2 left-2 w-32 h-32 pointer-events-none opacity-20"
            style={{
              background: 'radial-gradient(circle at 0% 0%, rgba(56,189,248,0.9) 0%, transparent 70%)',
            }}
          />
        )}
      </div>

      {/* 2. Precision-Milled Aluminum Platter Ring */}
      <div className="relative w-[84%] aspect-square rounded-full bg-gradient-to-tr from-slate-800 via-slate-600 to-slate-900 border-[3px] border-slate-400/80 shadow-[0_16px_45px_rgba(0,0,0,0.95)] flex items-center justify-center">
        {/* Outer Silver Bevel Edge */}
        <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none" />

        {/* 
          3. SPINNING GROOVED BLACK VINYL DISC
        */}
        <div
          className={`relative w-[92%] aspect-square rounded-full bg-[#05060b] shadow-2xl flex items-center justify-center overflow-hidden transition-all ${
            isPlaying ? 'animate-[spin_4.2s_linear_infinite]' : ''
          }`}
          style={{
            boxShadow: '0 0 35px rgba(0,0,0,0.98), inset 0 0 25px rgba(0,0,0,0.98)',
          }}
        >
          {/* Specular Light Reflection Glare Cones */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-30"
            style={{
              background:
                'conic-gradient(from 25deg, transparent 0deg, rgba(255,255,255,0.45) 35deg, transparent 75deg, transparent 180deg, rgba(255,255,255,0.45) 215deg, transparent 255deg)',
            }}
          />

          {/* Micro-Grooves */}
          <div className="absolute inset-2 rounded-full border border-white/5" />
          <div className="absolute inset-4 rounded-full border border-white/10" />
          <div className="absolute inset-6.5 rounded-full border border-white/5" />
          <div className="absolute inset-9 rounded-full border border-white/10" />
          <div className="absolute inset-11.5 rounded-full border border-white/5" />
          <div className="absolute inset-14 rounded-full border border-white/10" />
          <div className="absolute inset-16.5 rounded-full border border-white/5" />
          <div className="absolute inset-19 rounded-full border border-white/10" />

          {/* 
            4. AUTHENTIC HANDWRITTEN METALLIC MARKER INSCRIPTION ON THE VINYL
          */}
          <div className="absolute top-[17%] left-1/2 transform -translate-x-1/2 -rotate-[13deg] pointer-events-none select-none z-20 text-center">
            <div
              className="text-slate-100/95 font-bold tracking-wider leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.98)] flex flex-col items-center gap-0.5 select-none"
              style={{
                fontFamily: "'Permanent Marker', 'Caveat', cursive",
                letterSpacing: '0.06em',
                filter: 'drop-shadow(0 0 2px rgba(34,211,238,0.7)) drop-shadow(0 3px 6px rgba(0,0,0,0.95))',
              }}
            >
              <span className="text-2xl sm:text-3xl text-cyan-200 transform -rotate-1 tracking-wider">NUMO</span>
              <span className="text-xl sm:text-2xl text-sky-200/95 transform rotate-2 tracking-wide">Radio</span>
            </div>
          </div>

          {/* Center Vinyl Label Hub & Brass Spindle Pin */}
          <div className="relative w-[30%] aspect-square rounded-full bg-gradient-to-br from-slate-900 via-[#0b101e] to-slate-950 border border-cyan-400/30 shadow-inner flex flex-col items-center justify-center p-1.5 text-center select-none">
            <div className="absolute inset-1 rounded-full border border-cyan-400/20" />
            
            {/* Center Chrome Spindle Pin */}
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-slate-300 via-white to-slate-500 border border-slate-900 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </div>
          </div>
        </div>
      </div>

      {/* 
        5. ULTRA-SLEEK MINIMALIST SILVER TONEARM
      */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-28 h-48 pointer-events-none z-30 flex flex-col items-center">
        {/* Gimbal Bearing Pivot Base */}
        <div className="relative w-9 h-9 rounded-full bg-gradient-to-b from-slate-300 via-slate-600 to-slate-950 border border-slate-300/80 shadow-2xl flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-slate-950 border border-white/40 shadow-inner" />
          <div className="absolute -top-3 w-6 h-3 rounded-xs bg-gradient-to-r from-slate-700 via-slate-400 to-slate-800 border border-slate-300 shadow-lg" />
        </div>

        {/* Pivotable Straight Needle Wand */}
        <motion.div
          animate={{
            rotate: isPlaying ? 24 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 60,
            damping: 18,
          }}
          style={{ transformOrigin: 'top center' }}
          className="relative w-2 h-40 -mt-1 flex flex-col items-center"
        >
          {/* Straight Metallic Wand Tube */}
          <div className="w-1.5 h-32 bg-gradient-to-r from-slate-100 via-white to-slate-400 rounded-full shadow-lg" />

          {/* Cartridge Headshell with Glowing Stylus Needle Tip */}
          <div className="w-4 h-8 bg-gradient-to-b from-slate-800 via-slate-950 to-black border border-white/40 rounded-xs shadow-2xl flex flex-col items-center justify-end pb-0.5 transform -rotate-12">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isPlaying ? 'bg-cyan-300 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-600'
              }`}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export const Artwork: React.FC<ArtworkProps> = ({
  artUrl,
  songTitle,
  isPlaying,
  isBuffering,
}) => {
  const [imageError, setImageError] = useState(false);

  // View mode: 'cover' (artwork) or 'turntable' (spinning vinyl player)
  const [viewMode, setViewMode] = useState<'cover' | 'turntable'>(() => {
    return (localStorage.getItem('numo_artwork_view') as 'cover' | 'turntable') || 'cover';
  });

  // Equalizer style: 'spectrum' (28-band studio rods) | 'laser' (neon laser wave) | 'off' (disabled)
  const [equalizerMode, setEqualizerMode] = useState<'spectrum' | 'laser' | 'off'>(() => {
    return (localStorage.getItem('numo_eq_style') as 'spectrum' | 'laser' | 'off') || 'spectrum';
  });

  // Swipe gesture detection
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Detect horizontal swipe (at least 40px, predominantly horizontal)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      toggleViewMode();
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const toggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === 'cover' ? 'turntable' : 'cover';
      localStorage.setItem('numo_artwork_view', next);
      return next;
    });
  };

  const toggleEqualizerMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEqualizerMode((prev) => {
      let next: 'spectrum' | 'laser' | 'off';
      if (prev === 'spectrum') next = 'laser';
      else if (prev === 'laser') next = 'off';
      else next = 'spectrum';
      localStorage.setItem('numo_eq_style', next);
      return next;
    });
  };

  // Use direct URL if https, otherwise fallback to local proxy if available
  const resolvedArtUrl = artUrl
    ? (artUrl.startsWith('https://') ? artUrl : `/api/radio/art?url=${encodeURIComponent(artUrl)}`)
    : null;

  return (
    <div className="relative w-full flex items-center justify-center my-0 py-0">
      {/* Ambient background glow matching artwork with dynamic breathing */}
      <div
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
          isPlaying
            ? 'bg-gradient-to-tr from-cyan-500/35 via-sky-500/25 to-indigo-600/35 scale-105 opacity-80'
            : 'bg-gradient-to-tr from-slate-600/20 via-slate-700/20 to-slate-800/30 scale-95 opacity-30'
        }`}
      />

      {/* Main Card Container with Swipe Gesture & Gradient Border */}
      <motion.div
        animate={{
          scale: isPlaying ? 1 : 0.98,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 w-full aspect-square rounded-[32px] sm:rounded-[40px] p-[0.75px] bg-gradient-to-r from-purple-800 via-indigo-700 to-fuchsia-900 bg-[length:200%_200%] animate-gradient-border shadow-2xl shadow-black/80 overflow-hidden flex items-center justify-center group my-auto cursor-grab active:cursor-grabbing"
      >
        <div className="w-full h-full rounded-[35.5px] sm:rounded-[43.5px] p-1.5 sm:p-2 bg-gradient-to-b from-white/20 via-white/10 to-white/5 backdrop-blur-2xl border border-white/20 overflow-hidden flex items-center justify-center">
          <div className="relative w-full h-full rounded-[28px] sm:rounded-[34px] overflow-hidden bg-slate-900 flex items-center justify-center">
            
            {/* View Switching Transition between Cover Art and Vinyl Player */}
            <AnimatePresence mode="wait" initial={false}>
              {viewMode === 'cover' ? (
                <motion.div
                  key="cover-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full relative flex items-center justify-center overflow-hidden"
                >
                  {resolvedArtUrl && !imageError ? (
                    <img
                      src={resolvedArtUrl}
                      alt={songTitle || 'NUMO Radio'}
                      onError={() => setImageError(true)}
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                        isPlaying ? 'scale-105' : 'scale-100'
                      }`}
                    />
                  ) : (
                    /* Fallback vinyl cover */
                    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 select-none">
                      <div
                        className={`relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-white/10 bg-slate-950/80 shadow-inner ${
                          isPlaying ? 'animate-[spin_16s_linear_infinite]' : ''
                        }`}
                      >
                        <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                          <Radio className="w-8 h-8 animate-pulse" />
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <span className="text-sm font-black tracking-widest text-white/90 uppercase font-sans">
                          NUMO RADIO
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Interactive High-End Vinyl Turntable Player with handwritten marker "NUMO Radio" on black vinyl */
                <motion.div
                  key="turntable-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full relative"
                >
                  <VinylTurntablePlayer isPlaying={isPlaying} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buffering Overlay */}
            {isBuffering && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-20">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-white/20 text-xs font-semibold text-cyan-300 shadow-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  Буферизація...
                </div>
              </div>
            )}

            {/* 
              ELEGANT STUDIO EQUALIZER:
              - Sits flush at bottom edge
              - Tapping cycles between:
                1. 28-band Studio Spectrum
                2. Neon Laser Oscilloscope (edge-to-edge)
                3. OFF (Disabled)
            */}
            <button
              type="button"
              onClick={toggleEqualizerMode}
              title={
                equalizerMode === 'spectrum'
                  ? 'Спектр (натисніть для осцилографа)'
                  : equalizerMode === 'laser'
                  ? 'Осцилограф (натисніть для вимкнення)'
                  : 'Еквалайзер вимкнено (натисніть для увімкнення)'
              }
              aria-label="Перемкнути еквалайзер"
              className={`absolute bottom-0 left-0 right-0 z-20 cursor-pointer pointer-events-auto select-none focus:outline-none transition-all ${
                equalizerMode === 'off'
                  ? 'h-6 bg-transparent hover:bg-black/20 flex items-center justify-center'
                  : 'h-10 sm:h-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end justify-center pb-0.5 px-0'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {equalizerMode === 'spectrum' ? (
                  /* 1. Refined 28-Band Studio Spectrum Rods */
                  <motion.div
                    key="spectrum"
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    transition={{ duration: 0.2 }}
                    className="w-full flex items-end justify-between gap-[2px] h-8 sm:h-9 px-1.5 sm:px-2"
                  >
                    {STUDIO_SPECTRUM_BARS.map((bar, index) => (
                      <div
                        key={index}
                        className="flex-1 flex flex-col justify-end items-center h-full"
                      >
                        <div
                          className={`w-full rounded-t-sm transition-[opacity,box-shadow] bg-gradient-to-t ${bar.bg}`}
                          style={{
                            height: isPlaying ? undefined : '14%',
                            opacity: isPlaying ? 0.95 : 0.35,
                            boxShadow: isPlaying ? `0 0 8px ${bar.glow}` : 'none',
                            animationName: isPlaying ? bar.anim : 'none',
                            animationDuration: isPlaying ? bar.d : '0s',
                            animationTimingFunction: 'ease-in-out',
                            animationIterationCount: 'infinite',
                            animationDelay: bar.delay,
                          }}
                        />
                      </div>
                    ))}
                  </motion.div>
                ) : equalizerMode === 'laser' ? (
                  /* 2. Edge-to-Edge Dual Neon Laser Oscilloscope */
                  <motion.div
                    key="laser"
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    transition={{ duration: 0.2 }}
                    className="w-full flex items-center justify-center px-0 overflow-hidden"
                  >
                    <LaserOscilloscope isPlaying={isPlaying} />
                  </motion.div>
                ) : (
                  /* 3. OFF state - subtle dot cue on hover */
                  <motion.div
                    key="off"
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-60 transition-opacity"
                  >
                    <div className="w-8 h-1 rounded-full bg-white/40" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
