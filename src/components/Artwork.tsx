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
            4. DARK OBSIDIAN VINYL HUB WITH ANIMATED INFINITY (FIGURE 8) EQUALIZER
            - Clean grooved black vinyl record (no marker text)
            - Dark midnight obsidian center hub with subtle micro-grooves
            - Equalizer in the shape of 8 (infinity sign ∞) that dynamically expands and contracts in both directions
            - Left lobe in electric cyan/sky blue VU bars, right lobe in vibrant magenta/pink VU bars
            - Center spindle pin crossover
          */}
          <svg
            viewBox="0 0 400 400"
            className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
          >
            <defs>
              {/* Dark Obsidian Center Hub Radial Gradient */}
              <radialGradient id="darkHubGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0f1629" />
                <stop offset="55%" stopColor="#080c18" />
                <stop offset="85%" stopColor="#04060c" />
                <stop offset="100%" stopColor="#020306" />
              </radialGradient>

              {/* Glowing Infinity Ribbon Gradient (Cyan -> Indigo -> Magenta -> Pink -> Cyan) */}
              <linearGradient id="infinityRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="28%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="72%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>

              {/* Dynamic Infinity Aura Glow Filter */}
              <filter id="infinityAura" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38bdf8" floodOpacity="0.8" />
                <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#ec4899" floodOpacity="0.6" />
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.9" />
              </filter>

              {/* Peak LED Glow Filters */}
              <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#22d3ee" floodOpacity="0.95" />
              </filter>
              <filter id="pinkGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#f43f5e" floodOpacity="0.95" />
              </filter>
            </defs>

            <style>
              {`
                /* Breathing expansion and contraction in both directions (left and right) */
                @keyframes infinityBreathe {
                  0% {
                    transform: scaleX(0.82) scaleY(0.86);
                    filter: drop-shadow(0 0 6px rgba(34,211,238,0.4));
                  }
                  50% {
                    transform: scaleX(1.24) scaleY(1.15);
                    filter: drop-shadow(0 0 16px rgba(236,72,153,0.75)) drop-shadow(0 0 24px rgba(34,211,238,0.7));
                  }
                  100% {
                    transform: scaleX(0.82) scaleY(0.86);
                    filter: drop-shadow(0 0 6px rgba(34,211,238,0.4));
                  }
                }

                /* Traveling neon energy pulse along the infinity track */
                @keyframes infinityFlow {
                  0% { stroke-dashoffset: 0; }
                  100% { stroke-dashoffset: 240; }
                }

                /* Individual VU frequency bar dynamics */
                @keyframes vuLeftBar1 { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1.05); } }
                @keyframes vuLeftBar2 { 0%, 100% { transform: scaleY(0.75); } 50% { transform: scaleY(0.35); } }
                @keyframes vuLeftBar3 { 0%, 100% { transform: scaleY(0.45); } 50% { transform: scaleY(1.1); } }
                @keyframes vuLeftBar4 { 0%, 100% { transform: scaleY(0.85); } 50% { transform: scaleY(0.48); } }
                @keyframes vuLeftBar5 { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(0.98); } }

                @keyframes vuRightBar1 { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1.02); } }
                @keyframes vuRightBar2 { 0%, 100% { transform: scaleY(0.8); } 50% { transform: scaleY(0.42); } }
                @keyframes vuRightBar3 { 0%, 100% { transform: scaleY(0.42); } 50% { transform: scaleY(1.12); } }
                @keyframes vuRightBar4 { 0%, 100% { transform: scaleY(0.78); } 50% { transform: scaleY(0.4); } }
                @keyframes vuRightBar5 { 0%, 100% { transform: scaleY(0.48); } 50% { transform: scaleY(1.04); } }
              `}
            </style>

            {/* A. Dark Obsidian Center Vinyl Hub */}
            <g>
              {/* Outer Deep Titanium Bezel */}
              <circle
                cx="200"
                cy="200"
                r="64"
                fill="url(#darkHubGrad)"
                stroke="#1e273a"
                strokeWidth="2.5"
              />
              {/* Silver Chamfer Ring */}
              <circle
                cx="200"
                cy="200"
                r="61.5"
                fill="none"
                stroke="rgba(56,189,248,0.25)"
                strokeWidth="0.8"
              />
              {/* Inner Vinyl Micro-grooves on Hub */}
              <circle cx="200" cy="200" r="56" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.75" />
              <circle cx="200" cy="200" r="49" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" />
              <circle cx="200" cy="200" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.75" />
            </g>

            {/* 
              B. ANIMATED INFINITY (FIGURE 8) AUDIO EQUALIZER
              Expands and contracts horizontally and vertically in both directions!
            */}
            <g
              style={{
                transformOrigin: '200px 200px',
                animation: isPlaying ? 'infinityBreathe 1.8s ease-in-out infinite' : 'none',
              }}
              filter="url(#infinityAura)"
            >
              {/* 1. Base Glowing Infinity Track Outline */}
              <path
                d="M 200,200 C 214,178 238,178 245,190 C 252,202 245,214 235,218 C 218,222 208,206 200,200 C 192,194 182,178 165,182 C 155,186 148,198 155,210 C 162,222 185,222 200,200 Z"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 2. Flowing Neon Energy Ribbon */}
              <path
                d="M 200,200 C 214,178 238,178 245,190 C 252,202 245,214 235,218 C 218,222 208,206 200,200 C 192,194 182,178 165,182 C 155,186 148,198 155,210 C 162,222 185,222 200,200 Z"
                fill="none"
                stroke="url(#infinityRibbonGrad)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="14 10"
                style={{
                  animation: isPlaying ? 'infinityFlow 3s linear infinite' : 'none',
                }}
              />

              {/* 3. LEFT LOBE EQUALIZER (Electric Cyan & Sky Blue VU Bars) */}
              <g id="leftLoopEqualizer">
                {/* Bar L1 (x=165, 4 segments) */}
                <g
                  style={{
                    transformOrigin: '166px 212px',
                    animation: isPlaying ? 'vuLeftBar1 0.75s ease-in-out infinite alternate' : 'none',
                  }}
                >
                  <rect x="164.5" y="208.5" width="3.5" height="2" rx="0.5" fill="#22d3ee" opacity="0.8" />
                  <rect x="164.5" y="205.5" width="3.5" height="2" rx="0.5" fill="#22d3ee" opacity="0.8" />
                  <rect x="164.5" y="202.5" width="3.5" height="2" rx="0.5" fill="#38bdf8" opacity="0.9" />
                  <rect x="164.5" y="199.5" width="3.5" height="2" rx="0.5" fill="#67e8f9" filter="url(#cyanGlow)" />
                </g>

                {/* Bar L2 (x=171, 6 segments) */}
                <g
                  style={{
                    transformOrigin: '172px 214px',
                    animation: isPlaying ? 'vuLeftBar2 0.65s ease-in-out infinite alternate 0.1s' : 'none',
                  }}
                >
                  <rect x="170.5" y="210.5" width="3.5" height="2" rx="0.5" fill="#0891b2" opacity="0.8" />
                  <rect x="170.5" y="207.5" width="3.5" height="2" rx="0.5" fill="#06b6d4" opacity="0.8" />
                  <rect x="170.5" y="204.5" width="3.5" height="2" rx="0.5" fill="#22d3ee" opacity="0.85" />
                  <rect x="170.5" y="201.5" width="3.5" height="2" rx="0.5" fill="#38bdf8" opacity="0.9" />
                  <rect x="170.5" y="198.5" width="3.5" height="2" rx="0.5" fill="#38bdf8" opacity="0.9" />
                  <rect x="170.5" y="195.5" width="3.5" height="2" rx="0.5" fill="#a5f3fc" filter="url(#cyanGlow)" />
                </g>

                {/* Bar L3 (x=177, 8 segments - Peak left lobe) */}
                <g
                  style={{
                    transformOrigin: '178px 216px',
                    animation: isPlaying ? 'vuLeftBar3 0.95s ease-in-out infinite alternate 0.05s' : 'none',
                  }}
                >
                  <rect x="176.5" y="212.5" width="3.5" height="2" rx="0.5" fill="#0891b2" opacity="0.8" />
                  <rect x="176.5" y="209.5" width="3.5" height="2" rx="0.5" fill="#06b6d4" opacity="0.8" />
                  <rect x="176.5" y="206.5" width="3.5" height="2" rx="0.5" fill="#06b6d4" opacity="0.85" />
                  <rect x="176.5" y="203.5" width="3.5" height="2" rx="0.5" fill="#22d3ee" opacity="0.85" />
                  <rect x="176.5" y="200.5" width="3.5" height="2" rx="0.5" fill="#22d3ee" opacity="0.9" />
                  <rect x="176.5" y="197.5" width="3.5" height="2" rx="0.5" fill="#38bdf8" opacity="0.9" />
                  <rect x="176.5" y="194.5" width="3.5" height="2" rx="0.5" fill="#38bdf8" opacity="0.95" />
                  <rect x="176.5" y="191.5" width="3.5" height="2" rx="0.5" fill="#e0f2fe" filter="url(#cyanGlow)" />
                </g>

                {/* Bar L4 (x=183, 6 segments) */}
                <g
                  style={{
                    transformOrigin: '184px 214px',
                    animation: isPlaying ? 'vuLeftBar4 0.72s ease-in-out infinite alternate 0.18s' : 'none',
                  }}
                >
                  <rect x="182.5" y="210.5" width="3.5" height="2" rx="0.5" fill="#0891b2" opacity="0.8" />
                  <rect x="182.5" y="207.5" width="3.5" height="2" rx="0.5" fill="#06b6d4" opacity="0.8" />
                  <rect x="182.5" y="204.5" width="3.5" height="2" rx="0.5" fill="#22d3ee" opacity="0.85" />
                  <rect x="182.5" y="201.5" width="3.5" height="2" rx="0.5" fill="#38bdf8" opacity="0.9" />
                  <rect x="182.5" y="198.5" width="3.5" height="2" rx="0.5" fill="#818cf8" opacity="0.9" />
                  <rect x="182.5" y="195.5" width="3.5" height="2" rx="0.5" fill="#c7d2fe" filter="url(#cyanGlow)" />
                </g>

                {/* Bar L5 (x=189, 4 segments) */}
                <g
                  style={{
                    transformOrigin: '190px 210px',
                    animation: isPlaying ? 'vuLeftBar5 0.82s ease-in-out infinite alternate 0.12s' : 'none',
                  }}
                >
                  <rect x="188.5" y="207.5" width="3.5" height="2" rx="0.5" fill="#4f46e5" opacity="0.8" />
                  <rect x="188.5" y="204.5" width="3.5" height="2" rx="0.5" fill="#6366f1" opacity="0.85" />
                  <rect x="188.5" y="201.5" width="3.5" height="2" rx="0.5" fill="#818cf8" opacity="0.9" />
                  <rect x="188.5" y="198.5" width="3.5" height="2" rx="0.5" fill="#a5b4fc" filter="url(#cyanGlow)" />
                </g>
              </g>

              {/* 4. RIGHT LOBE EQUALIZER (Electric Magenta, Pink & Violet VU Bars) */}
              <g id="rightLoopEqualizer">
                {/* Bar R1 (x=211, 4 segments) */}
                <g
                  style={{
                    transformOrigin: '211px 210px',
                    animation: isPlaying ? 'vuRightBar1 0.8s ease-in-out infinite alternate 0.08s' : 'none',
                  }}
                >
                  <rect x="209.5" y="207.5" width="3.5" height="2" rx="0.5" fill="#7c3aed" opacity="0.8" />
                  <rect x="209.5" y="204.5" width="3.5" height="2" rx="0.5" fill="#9333ea" opacity="0.85" />
                  <rect x="209.5" y="201.5" width="3.5" height="2" rx="0.5" fill="#c084fc" opacity="0.9" />
                  <rect x="209.5" y="198.5" width="3.5" height="2" rx="0.5" fill="#f0abfc" filter="url(#pinkGlow)" />
                </g>

                {/* Bar R2 (x=217, 6 segments) */}
                <g
                  style={{
                    transformOrigin: '217px 214px',
                    animation: isPlaying ? 'vuRightBar2 0.68s ease-in-out infinite alternate 0.15s' : 'none',
                  }}
                >
                  <rect x="215.5" y="210.5" width="3.5" height="2" rx="0.5" fill="#9d174d" opacity="0.8" />
                  <rect x="215.5" y="207.5" width="3.5" height="2" rx="0.5" fill="#be185d" opacity="0.8" />
                  <rect x="215.5" y="204.5" width="3.5" height="2" rx="0.5" fill="#db2777" opacity="0.85" />
                  <rect x="215.5" y="201.5" width="3.5" height="2" rx="0.5" fill="#ec4899" opacity="0.9" />
                  <rect x="215.5" y="198.5" width="3.5" height="2" rx="0.5" fill="#f472b6" opacity="0.9" />
                  <rect x="215.5" y="195.5" width="3.5" height="2" rx="0.5" fill="#fbcfe8" filter="url(#pinkGlow)" />
                </g>

                {/* Bar R3 (x=223, 8 segments - Peak right lobe) */}
                <g
                  style={{
                    transformOrigin: '223px 216px',
                    animation: isPlaying ? 'vuRightBar3 1.02s ease-in-out infinite alternate 0.02s' : 'none',
                  }}
                >
                  <rect x="221.5" y="212.5" width="3.5" height="2" rx="0.5" fill="#9f1239" opacity="0.8" />
                  <rect x="221.5" y="209.5" width="3.5" height="2" rx="0.5" fill="#be123c" opacity="0.8" />
                  <rect x="221.5" y="206.5" width="3.5" height="2" rx="0.5" fill="#e11d48" opacity="0.85" />
                  <rect x="221.5" y="203.5" width="3.5" height="2" rx="0.5" fill="#f43f5e" opacity="0.85" />
                  <rect x="221.5" y="200.5" width="3.5" height="2" rx="0.5" fill="#fb7185" opacity="0.9" />
                  <rect x="221.5" y="197.5" width="3.5" height="2" rx="0.5" fill="#ec4899" opacity="0.9" />
                  <rect x="221.5" y="194.5" width="3.5" height="2" rx="0.5" fill="#f472b6" opacity="0.95" />
                  <rect x="221.5" y="191.5" width="3.5" height="2" rx="0.5" fill="#ffe4e6" filter="url(#pinkGlow)" />
                </g>

                {/* Bar R4 (x=229, 6 segments) */}
                <g
                  style={{
                    transformOrigin: '229px 214px',
                    animation: isPlaying ? 'vuRightBar4 0.7s ease-in-out infinite alternate 0.2s' : 'none',
                  }}
                >
                  <rect x="227.5" y="210.5" width="3.5" height="2" rx="0.5" fill="#be185d" opacity="0.8" />
                  <rect x="227.5" y="207.5" width="3.5" height="2" rx="0.5" fill="#db2777" opacity="0.8" />
                  <rect x="227.5" y="204.5" width="3.5" height="2" rx="0.5" fill="#ec4899" opacity="0.85" />
                  <rect x="227.5" y="201.5" width="3.5" height="2" rx="0.5" fill="#f472b6" opacity="0.9" />
                  <rect x="227.5" y="198.5" width="3.5" height="2" rx="0.5" fill="#fb7185" opacity="0.9" />
                  <rect x="227.5" y="195.5" width="3.5" height="2" rx="0.5" fill="#fce7f3" filter="url(#pinkGlow)" />
                </g>

                {/* Bar R5 (x=235, 4 segments) */}
                <g
                  style={{
                    transformOrigin: '235px 212px',
                    animation: isPlaying ? 'vuRightBar5 0.85s ease-in-out infinite alternate 0.1s' : 'none',
                  }}
                >
                  <rect x="233.5" y="208.5" width="3.5" height="2" rx="0.5" fill="#e11d48" opacity="0.8" />
                  <rect x="233.5" y="205.5" width="3.5" height="2" rx="0.5" fill="#f43f5e" opacity="0.8" />
                  <rect x="233.5" y="202.5" width="3.5" height="2" rx="0.5" fill="#fb7185" opacity="0.9" />
                  <rect x="233.5" y="199.5" width="3.5" height="2" rx="0.5" fill="#fda4af" filter="url(#pinkGlow)" />
                </g>
              </g>

              {/* 5. Center Crossover Spindle Node */}
              <circle cx="200" cy="200" r="5" fill="#030712" stroke="#818cf8" strokeWidth="1.2" />
              <circle cx="200" cy="200" r="2.2" fill="#c7d2fe" />
            </g>
          </svg>
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
  const [isCoverReady, setIsCoverReady] = useState(false);
  const userSwitchedRef = useRef(false);

  // View mode: 'cover' (artwork) or 'turntable' (spinning vinyl player)
  const [viewMode, setViewMode] = useState<'cover' | 'turntable'>('turntable');
  const [direction, setDirection] = useState<number>(0);

  // Equalizer style: 'spectrum' (28-band studio rods) | 'laser' (neon laser wave) | 'off' (disabled)
  const [equalizerMode, setEqualizerMode] = useState<'spectrum' | 'laser' | 'off'>(() => {
    return (localStorage.getItem('numo_eq_style') as 'spectrum' | 'laser' | 'off') || 'spectrum';
  });

  // Direct image preloader: keep turntable player visible until cover image is 100% loaded
  const resolvedArtUrl = artUrl
    ? (artUrl.startsWith('https://') || artUrl.startsWith('http://') ? artUrl : `/api/radio/art?url=${encodeURIComponent(artUrl)}`)
    : null;

  useEffect(() => {
    if (!resolvedArtUrl) {
      setIsCoverReady(false);
      setImageError(false);
      if (!userSwitchedRef.current) {
        setDirection(1);
        setViewMode('turntable');
      }
      return;
    }

    let isMounted = true;
    setImageError(false);
    setIsCoverReady(false);

    const img = new Image();
    img.src = resolvedArtUrl;
    img.onload = () => {
      if (isMounted) {
        setIsCoverReady(true);
        if (!userSwitchedRef.current) {
          setDirection(-1);
          setViewMode('cover');
        }
      }
    };
    img.onerror = () => {
      if (isMounted) {
        setImageError(true);
        setIsCoverReady(false);
        if (!userSwitchedRef.current) {
          setDirection(1);
          setViewMode('turntable');
        }
      }
    };

    return () => {
      isMounted = false;
    };
  }, [resolvedArtUrl]);

  // Directional Horizontal Swipe Detection
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

    // Detect horizontal swipe (at least 35px, predominantly horizontal)
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        // Swiped left -> transition to next view
        toggleViewMode(1);
      } else {
        // Swiped right -> transition to previous view
        toggleViewMode(-1);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const switchView = (targetMode: 'cover' | 'turntable') => {
    if (targetMode === viewMode) return;
    setDirection(targetMode === 'turntable' ? 1 : -1);
    userSwitchedRef.current = true;
    setViewMode(targetMode);
  };

  const toggleViewMode = (swipeDir: number = 1) => {
    setDirection(swipeDir);
    userSwitchedRef.current = true;
    setViewMode((prev) => (prev === 'cover' ? 'turntable' : 'cover'));
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

  // Horizontal directional slide carousel variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 30 },
        opacity: { duration: 0.28 },
        scale: { duration: 0.28 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 30 },
        opacity: { duration: 0.22 },
        scale: { duration: 0.22 },
      },
    }),
  };

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
        initial={{
          scale: isPlaying ? 1 : 0.98,
        }}
        animate={{
          scale: isPlaying ? 1 : 0.98,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 w-full aspect-square rounded-[32px] sm:rounded-[40px] p-[0.75px] bg-gradient-to-r from-purple-800 via-indigo-700 to-fuchsia-900 bg-[length:200%_200%] animate-gradient-border shadow-2xl shadow-black/80 overflow-hidden flex items-center justify-center group my-auto cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <div className="w-full h-full rounded-[35.5px] sm:rounded-[43.5px] p-1.5 sm:p-2 bg-gradient-to-b from-white/20 via-white/10 to-white/5 backdrop-blur-2xl border border-white/20 overflow-hidden flex items-center justify-center">
          <div className="relative w-full h-full rounded-[28px] sm:rounded-[34px] overflow-hidden bg-slate-900 flex items-center justify-center">
            
            {/* View Switching Transition between Cover Art and Vinyl Player */}
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              {viewMode === 'cover' && isCoverReady && resolvedArtUrl && !imageError ? (
                <motion.div
                  key="cover-view"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full h-full relative flex items-center justify-center overflow-hidden bg-slate-900 z-10"
                >
                  <img
                    src={resolvedArtUrl}
                    alt={songTitle || 'NUMO Radio'}
                    onError={() => setImageError(true)}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-out select-none pointer-events-none ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                </motion.div>
              ) : (
                /* Interactive High-End Vinyl Turntable Player */
                <motion.div
                  key="turntable-view"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full h-full relative z-0"
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
                1. 28-band Studio Spectrum (rises smoothly from bottom upwards)
                2. Neon Laser Oscilloscope (flows in from side, manifesting from glow)
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
              className={`absolute bottom-0 left-0 right-0 z-20 cursor-pointer pointer-events-auto select-none focus:outline-none ${
                equalizerMode === 'off'
                  ? 'h-8 bg-transparent'
                  : 'h-10 sm:h-12 bg-gradient-to-t from-black/50 via-black/15 to-transparent flex items-end justify-center pb-0 px-0'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {equalizerMode === 'spectrum' ? (
                  /* 1. Refined 28-Band Studio Spectrum Rods: sits 100% flush at the bottom frame */
                  <motion.div
                    key="spectrum"
                    initial={{ opacity: 0, y: 24, scaleY: 0.2 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: 24, scaleY: 0.2 }}
                    transition={{
                      type: 'spring' as const,
                      stiffness: 280,
                      damping: 24,
                      duration: 0.35,
                    }}
                    style={{ transformOrigin: 'bottom center' }}
                    className="w-full flex items-end justify-between gap-[2px] h-full px-1.5 sm:px-2 pb-0 m-0"
                  >
                    {STUDIO_SPECTRUM_BARS.map((bar, index) => (
                      <div
                        key={index}
                        className="flex-1 flex flex-col justify-end items-center h-full pb-0 m-0"
                      >
                        <div
                          className={`w-full rounded-t-sm rounded-b-none transition-[opacity,box-shadow] bg-gradient-to-t ${bar.bg}`}
                          style={{
                            height: '14%',
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
                  /* 2. Edge-to-Edge Dual Neon Laser Oscilloscope: flows in from side and manifests from glow */
                  <motion.div
                    key="laser"
                    initial={{ opacity: 0, scaleX: 0.25, filter: 'blur(8px)', x: -50 }}
                    animate={{ opacity: 1, scaleX: 1, filter: 'blur(0px)', x: 0 }}
                    exit={{ opacity: 0, scaleX: 0.25, filter: 'blur(8px)', x: 50 }}
                    transition={{
                      type: 'spring' as const,
                      stiffness: 240,
                      damping: 26,
                      duration: 0.4,
                    }}
                    style={{ transformOrigin: 'center center' }}
                    className="w-full flex items-center justify-center px-0 overflow-hidden"
                  >
                    <LaserOscilloscope isPlaying={isPlaying} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
