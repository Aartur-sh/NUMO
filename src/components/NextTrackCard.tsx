import React from 'react';
import type { PlayingNext } from '../types';
import type { Language } from '../i18n';
import { translations } from '../i18n';

interface NextTrackCardProps {
  playingNext: PlayingNext | null;
  lang?: Language;
}

export const NextTrackCard: React.FC<NextTrackCardProps> = ({ playingNext, lang = 'uk' }) => {
  const t = translations[lang];
  const nextTitle = playingNext?.song?.title || t.musicMix;
  const nextArtist = playingNext?.song?.artist || '';

  return (
    <div className="w-full my-0 px-1 py-0.5 flex items-center justify-start gap-1.5 text-left text-xs text-slate-400 select-none">
      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex-shrink-0">{t.nextTrack}</span>
      <span className="font-medium text-slate-300 truncate text-[11px]">
        {nextTitle} {nextArtist ? `— ${nextArtist}` : ''}
      </span>
    </div>
  );
};
