import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { NowPlayingResponse } from '../types';
import type { Language } from '../i18n';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: NowPlayingResponse | null;
  lang: Language;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  // Automatically smoothly fade away after 2.2 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2200);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed bottom-28 sm:bottom-32 left-0 right-0 z-50 flex items-center justify-center pointer-events-none px-4"
          style={{
            bottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 104px), 116px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: 'spring' as const,
              stiffness: 420,
              damping: 28,
            }}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[#0d121f]/95 backdrop-blur-2xl border border-cyan-400/40 text-cyan-200 shadow-[0_12px_32px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] text-xs font-semibold select-none cursor-default"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse flex-shrink-0" />
            <span className="tracking-wide">
              {lang === 'en' ? 'In development' : 'В розробці'}
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

