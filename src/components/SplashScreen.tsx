import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      if (sessionStorage.getItem('numo_splash_shown') === 'true') {
        return false;
      }
    } catch {}
    return true;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('numo_splash_shown', 'true');
    } catch {}
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
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
            {/* Master Stylized 3-Equalizer N Musical Logo Icon */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-0.5 bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 shadow-2xl shadow-cyan-950/80">
              <div className="w-full h-full rounded-[22px] bg-[#000000] flex items-center justify-center p-3 relative overflow-hidden">
                {/* Embedded SVG of 3-Equalizer Letter N Logo */}
                <svg
                  viewBox="0 0 512 512"
                  className="w-full h-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
                >
                  <defs>
                    <filter id="splashCyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#22d3ee" floodOpacity="0.9" />
                    </filter>
                    <filter id="splashIndigoGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#818cf8" floodOpacity="0.9" />
                    </filter>
                    <filter id="splashMagentaGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#ec4899" floodOpacity="0.9" />
                    </filter>
                  </defs>

                  <g id="letterN-EqualizerSplash">
                    {/* Left Pillar */}
                    <g>
                      <rect x="114" y="372" width="48" height="30" rx="10" fill="#0284c7" />
                      <rect x="114" y="334" width="48" height="30" rx="10" fill="#0369a1" />
                      <rect x="114" y="296" width="48" height="30" rx="10" fill="#0284c7" />
                      <rect x="114" y="258" width="48" height="30" rx="10" fill="#0ea5e9" />
                      <rect x="114" y="220" width="48" height="30" rx="10" fill="#0ea5e9" />
                      <rect x="114" y="182" width="48" height="30" rx="10" fill="#38bdf8" />
                      <rect x="114" y="144" width="48" height="30" rx="10" fill="#38bdf8" />
                      <rect x="114" y="106" width="48" height="30" rx="10" fill="#a5f3fc" filter="url(#splashCyanGlow)" />
                      <circle cx="138" cy="86" r="4.5" fill="#38bdf8" filter="url(#splashCyanGlow)" />
                    </g>

                    {/* Diagonal Stroke */}
                    <g>
                      <g transform="translate(176, 142) rotate(38)">
                        <rect x="-23" y="-14" width="46" height="28" rx="9" fill="#38bdf8" />
                      </g>
                      <g transform="translate(202, 178) rotate(38)">
                        <rect x="-23" y="-14" width="46" height="28" rx="9" fill="#60a5fa" />
                      </g>
                      <g transform="translate(228, 214) rotate(38)">
                        <rect x="-23" y="-14" width="46" height="28" rx="9" fill="#3b82f6" />
                      </g>
                      <g transform="translate(256, 256) rotate(38)">
                        <rect x="-24" y="-15" width="48" height="30" rx="10" fill="#818cf8" filter="url(#splashIndigoGlow)" />
                      </g>
                      <g transform="translate(284, 298) rotate(38)">
                        <rect x="-23" y="-14" width="46" height="28" rx="9" fill="#6366f1" />
                      </g>
                      <g transform="translate(310, 334) rotate(38)">
                        <rect x="-23" y="-14" width="46" height="28" rx="9" fill="#a855f7" />
                      </g>
                      <g transform="translate(336, 370) rotate(38)">
                        <rect x="-23" y="-14" width="46" height="28" rx="9" fill="#c084fc" />
                      </g>
                    </g>

                    {/* Right Pillar */}
                    <g>
                      <rect x="350" y="372" width="48" height="30" rx="10" fill="#701a75" />
                      <rect x="350" y="334" width="48" height="30" rx="10" fill="#86198f" />
                      <rect x="350" y="296" width="48" height="30" rx="10" fill="#a21caf" />
                      <rect x="350" y="258" width="48" height="30" rx="10" fill="#c026d3" />
                      <rect x="350" y="220" width="48" height="30" rx="10" fill="#d946ef" />
                      <rect x="350" y="182" width="48" height="30" rx="10" fill="#ec4899" />
                      <rect x="350" y="144" width="48" height="30" rx="10" fill="#f43f5e" />
                      <rect x="350" y="106" width="48" height="30" rx="10" fill="#ffe4e6" filter="url(#splashMagentaGlow)" />
                      <circle cx="374" cy="86" r="4.5" fill="#f43f5e" filter="url(#splashMagentaGlow)" />
                    </g>
                  </g>
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
