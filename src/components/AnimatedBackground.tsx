import React from 'react';

interface AnimatedBackgroundProps {
  isPlaying: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ isPlaying }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070A12]">
      {/* Dynamic slow flowing radial gradient 1 - Top Left */}
      <div
        className={`absolute -top-24 -left-24 w-[110vw] max-w-[620px] h-[110vw] max-h-[620px] rounded-full blur-[90px] sm:blur-[120px] transition-all duration-1000 animate-mesh-1 ${
          isPlaying
            ? 'bg-gradient-to-br from-cyan-500/35 via-sky-500/25 to-blue-600/20 opacity-90'
            : 'bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-rose-600/20 opacity-75'
        }`}
      />

      {/* Dynamic slow flowing radial gradient 2 - Bottom Right */}
      <div
        className={`absolute -bottom-32 -right-32 w-[110vw] max-w-[640px] h-[110vw] max-h-[640px] rounded-full blur-[100px] sm:blur-[130px] transition-all duration-1000 animate-mesh-2 ${
          isPlaying
            ? 'bg-gradient-to-tl from-indigo-500/35 via-violet-500/30 to-cyan-400/20 opacity-90'
            : 'bg-gradient-to-tl from-rose-600/30 via-amber-600/25 to-indigo-950/40 opacity-75'
        }`}
      />

      {/* Center atmospheric breathing aura */}
      <div
        className={`absolute top-1/2 left-1/2 w-[85vw] max-w-[440px] h-[85vw] max-h-[440px] rounded-full blur-[80px] sm:blur-[100px] transition-all duration-1000 animate-mesh-center ${
          isPlaying
            ? 'bg-gradient-to-tr from-cyan-400/20 via-sky-400/15 to-indigo-400/20'
            : 'bg-gradient-to-tr from-amber-400/20 via-orange-400/15 to-rose-500/15'
        }`}
      />

      {/* Soft atmospheric overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,7,12,0.55)_100%)] pointer-events-none" />
    </div>
  );
};
