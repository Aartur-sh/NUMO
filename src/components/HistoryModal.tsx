import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Music, Clock, Disc } from 'lucide-react';
import type { NowPlayingResponse } from '../types';
import type { Language } from '../i18n';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NowPlayingResponse | null;
  lang: Language;
}

const TrackArtThumbnail: React.FC<{ artUrl?: string; title: string }> = ({ artUrl, title }) => {
  const [hasError, setHasError] = useState(false);

  if (artUrl && !hasError) {
    return (
      <img
        src={artUrl}
        alt={title}
        className="w-full h-full object-cover rounded-xl"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-tr from-cyan-950 via-indigo-950 to-slate-900 flex items-center justify-center">
      <Music className="w-5 h-5 text-cyan-400" />
    </div>
  );
};

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  data,
  lang,
}) => {
  const songHistory = data?.song_history || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-start px-4 pb-6 overflow-hidden"
          style={{
            paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 24px)',
          }}
        >
          {/* Smooth Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            style={{
              transformOrigin: '24px calc(100% - 24px)',
            }}
            initial={{ opacity: 0, scale: 0.15, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.15, y: 16 }}
            transition={{
              duration: 0.36,
              ease: [0.05, 0.7, 0.1, 1.0],
            }}
            className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/60 p-5 sm:p-6 shadow-2xl shadow-black flex flex-col gap-4 max-h-[85vh] overflow-y-auto text-white z-10 will-change-transform"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white font-bold">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white tracking-wide flex items-center gap-1.5">
                    {lang === 'en' ? 'Track History' : 'Історія треків'}
                  </h2>
                  <p className="text-[11px] text-cyan-300/80 font-medium">
                    {lang === 'en' ? 'Recently played on NUMO Radio' : 'Нещодавно в ефірі NUMO Radio'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрити"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Song History List */}
            {songHistory.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {songHistory.map((item, idx) => {
                  const title = item.song?.title || item.song?.text || 'Невідомий трек';
                  const artist = item.song?.artist;
                  const albumArt = item.song?.art;
                  const playedAt = item.played_at
                    ? new Date(item.played_at * 1000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : null;

                  return (
                    <div
                      key={item.sh_id || idx}
                      className="group relative p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-cyan-400/40 transition-all flex items-center gap-3 shadow-sm"
                    >
                      {/* Album Art Container */}
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-950 border border-white/15 flex items-center justify-center flex-shrink-0 shadow-md">
                        <TrackArtThumbnail artUrl={albumArt} title={title} />
                      </div>

                      {/* Song Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-slate-100 truncate group-hover:text-cyan-200 transition-colors">
                          {title}
                        </p>
                        {artist && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                            {artist}
                          </p>
                        )}
                      </div>

                      {/* Played Time Tag */}
                      {playedAt && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-cyan-300 flex-shrink-0">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{playedAt}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
                <Disc className="w-10 h-10 text-cyan-400/50 animate-spin" style={{ animationDuration: '8s' }} />
                <p className="text-xs font-semibold">
                  {lang === 'en' ? 'No recent tracks available' : 'Історія треків завантажується...'}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
