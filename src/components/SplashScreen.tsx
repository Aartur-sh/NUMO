import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash for 1.5 seconds, then fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070a12] select-none cursor-pointer overflow-hidden"
        >
          {/* Ambient Radial Lights */}
          <div className="absolute w-96 h-96 rounded-full bg-cyan-500/15 blur-[90px] animate-pulse pointer-events-none" />
          <div className="absolute w-80 h-80 rounded-full bg-indigo-500/15 blur-[80px] pointer-events-none translate-y-12" />

          {/* Concentric Expanding Radio Waves */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.8, 1.4, 1.8], opacity: [0.4, 0.15, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
            className="absolute w-48 h-48 rounded-full border border-cyan-400/40 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.8, 1.4, 1.8], opacity: [0.4, 0.15, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0.6, ease: 'easeOut' }}
            className="absolute w-48 h-48 rounded-full border border-indigo-400/30 pointer-events-none"
          />

          {/* Central Logo Container */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center gap-3 z-10"
          >
            {/* Master Stylized Woven NUMO Musical Logo Icon */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-0.5 bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 shadow-2xl shadow-cyan-950/80">
              <div className="w-full h-full rounded-[22px] bg-[#0b0f1a] flex items-center justify-center p-3 relative overflow-hidden">
                {/* Embedded SVG of Woven NUMO Musical Monogram */}
                <svg
                  viewBox="0 0 512 512"
                  className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                >
                  <defs>
                    <linearGradient id="splashCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="50%" stopColor="#0284C7" />
                      <stop offset="100%" stopColor="#0369A1" />
                    </linearGradient>
                    <linearGradient id="splashViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="50%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                    <linearGradient id="splashWave" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="35%" stopColor="#0284C7" />
                      <stop offset="70%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                    <linearGradient id="splashVinyl" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="50%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                  </defs>

                  {/* Equalizer Frequency Background Bars */}
                  <g opacity="0.35">
                    <rect x="72" y="210" width="6" height="92" rx="3" fill="#38BDF8" />
                    <rect x="86" y="170" width="6" height="172" rx="3" fill="#38BDF8" />
                    <rect x="420" y="170" width="6" height="172" rx="3" fill="#C084FC" />
                    <rect x="434" y="210" width="6" height="92" rx="3" fill="#C084FC" />
                  </g>

                  {/* 1. 'U' Base Curve */}
                  <path
                    d="M 172 340 C 172 395 340 395 340 340 L 340 376 C 340 425 172 425 172 376 Z"
                    fill="url(#splashWave)"
                    opacity="0.9"
                  />

                  {/* 2. 'N' Left Pillar */}
                  <path
                    d="M 148 136 C 148 116 164 100 184 100 C 204 100 220 116 220 136 L 220 372 C 220 392 204 408 184 408 C 164 408 148 392 148 372 Z"
                    fill="url(#splashCyan)"
                  />

                  {/* 3. 'N' Right Pillar & Eighth Note Flag */}
                  <path
                    d="M 292 136 C 292 116 308 100 328 100 C 348 100 364 116 364 136 L 364 372 C 364 392 348 408 328 408 C 308 408 292 392 292 372 Z"
                    fill="url(#splashViolet)"
                  />
                  <path
                    d="M 348 102 C 388 90 420 120 412 165 C 392 135 368 132 348 138 Z"
                    fill="url(#splashViolet)"
                  />

                  {/* 4. Woven Diagonal Wave */}
                  <path
                    d="M 180 112 C 196 100 218 110 222 130 L 328 372 C 334 386 324 402 308 404 C 294 406 278 394 274 378 L 168 136 C 162 122 168 114 180 112 Z"
                    fill="url(#splashWave)"
                  />

                  {/* Specular Highlight Line */}
                  <path
                    d="M 190 126 L 312 380"
                    stroke="#FFFFFF"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeOpacity="0.8"
                  />

                  {/* 5. 'O' Central Vinyl Record Disc & Pulsing Core */}
                  <circle cx="256" cy="256" r="48" fill="#090D16" stroke="url(#splashVinyl)" strokeWidth="5" />
                  <circle cx="256" cy="256" r="38" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="8 6 12 6" />
                  <circle cx="256" cy="256" r="18" fill="url(#splashVinyl)" />
                  <circle cx="256" cy="256" r="8" fill="#0A0F1D" />
                  <circle cx="256" cy="256" r="4" fill="#FFFFFF" />
                </svg>

                {/* Shimmer sweep effect */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                />
              </div>
            </div>

            {/* Wordmark NUMO with Waving Ukrainian Flag Wave & Equal-Height 'O' */}
            <div className="flex items-center tracking-tight mt-1">
              <div className="relative flex items-center h-8">
                <svg
                  viewBox="0 0 58 28"
                  className="h-8 w-auto select-none pointer-events-none drop-shadow-[0_2px_10px_rgba(0,87,183,0.5)]"
                >
                  <defs>
                    <clipPath id="numSplashClip">
                      <text
                        x="0"
                        y="23"
                        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                        fontWeight="900"
                        fontSize="27"
                        letterSpacing="-0.8"
                      >
                        NUM
                      </text>
                    </clipPath>
                    <linearGradient id="splashBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0057b7" />
                      <stop offset="50%" stopColor="#0077e6" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                    <linearGradient id="splashGold" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffd700" />
                      <stop offset="50%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#eab308" />
                    </linearGradient>
                  </defs>

                  <g clipPath="url(#numSplashClip)">
                    <rect x="0" y="0" width="58" height="28" fill="url(#splashBlue)" />
                    <path
                      className="animate-flag-wave"
                      fill="url(#splashGold)"
                      d="M -78 13.5 Q -58.5 9, -39 13.5 T 0 13.5 Q 19.5 9, 39 13.5 T 78 13.5 Q 97.5 9, 117 13.5 T 156 13.5 L 156 28 L -78 28 Z"
                    />
                  </g>
                </svg>
              </div>

              {/* Exact matching height animated 'O' */}
              <span className="relative flex items-center justify-center w-[25px] h-[25px] rounded-full border-2 border-cyan-400 bg-cyan-950/40 text-cyan-300 ml-1 sm:ml-1.5 shadow-[0_0_14px_rgba(34,211,238,0.7)] animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-0.5">
              Electronic & Ambient
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
