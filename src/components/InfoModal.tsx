import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Radio,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowDownCircle,
  Loader2,
  FlaskConical,
  Heart,
  Server,
} from 'lucide-react';
import type { NowPlayingResponse } from '../types';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import {
  APP_VERSION,
  checkForAppUpdate,
  type AppReleaseInfo,
} from '../services/updateService';
import { NativeUpdate } from '../services/nativeUpdateService';
import { STREAM_SERVERS, type ServerId } from '../hooks/useRadioStream';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NowPlayingResponse | null;
  lang: Language;
  onOpenUpdateModal?: (info: AppReleaseInfo) => void;
  releaseInfo?: AppReleaseInfo | null;
  selectedServer?: ServerId;
  onSelectServer?: (id: ServerId) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  data,
  lang,
  releaseInfo,
  selectedServer = 'server1',
  onSelectServer,
}) => {
  const t = translations[lang];
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isBetaChecking, setIsBetaChecking] = useState(false);
  const [inlineStatus, setInlineStatus] = useState<{
    type: 'success' | 'error' | 'beta';
    text: string;
  } | null>(null);

  // When an update is found, show the dedicated download row below the version
  const [availableUpdate, setAvailableUpdate] = useState<AppReleaseInfo | null>(null);

  useEffect(() => {
    if (isOpen && releaseInfo?.hasUpdate && !availableUpdate) {
      setAvailableUpdate(releaseInfo);
    }
  }, [isOpen, releaseInfo]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadStatusText, setDownloadStatusText] = useState<string>('');

  // 4-second Long Press state & ref
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressFiredRef = useRef(false);

  // App version strictly from package.json (APP_VERSION)
  const currentVersion = APP_VERSION;

  const isCurrentBeta =
    currentVersion.toLowerCase().includes('b') ||
    currentVersion.toLowerCase().includes('beta');

  // Cleanup on unmount or modal close
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const handleOpenMonobank = () => {
    NativeUpdate.openExternalUrl('https://send.monobank.ua/jar/64ez3eZeN8');
  };

  const handleOpenPayPal = () => {
    NativeUpdate.openExternalUrl('https://paypal.me/somaradio');
  };

  const executeUpdateCheck = async (includePrerelease = false) => {
    if (isCheckingUpdate || isDownloading || inlineStatus !== null || availableUpdate !== null) {
      return;
    }

    setIsCheckingUpdate(true);
    setIsBetaChecking(includePrerelease);
    setInlineStatus(null);
    setAvailableUpdate(null);

    try {
      const releaseInfo = await checkForAppUpdate({ includePrerelease });
      setIsCheckingUpdate(false);
      setIsBetaChecking(false);

      if (releaseInfo.hasUpdate) {
        setAvailableUpdate(releaseInfo);
      } else {
        // Show "У вас остання версія" (або бета)
        setInlineStatus({
          type: includePrerelease ? 'beta' : 'success',
          text: includePrerelease
            ? lang === 'en'
              ? 'You have the latest beta version'
              : 'У вас найновіша бета-версія'
            : lang === 'en'
            ? 'You have the latest version'
            : 'У вас остання версія',
        });
        setTimeout(() => {
          setInlineStatus(null);
        }, 3800);
      }
    } catch (err: any) {
      setIsCheckingUpdate(false);
      setIsBetaChecking(false);
      const isNotFound = err?.message?.includes('404') || err?.message?.includes('Релізи');
      setInlineStatus({
        type: 'error',
        text: isNotFound
          ? lang === 'en'
            ? 'No releases published yet on GitHub'
            : 'Релізів на GitHub ще немає'
          : t.updateCheckFailed,
      });
      setTimeout(() => {
        setInlineStatus(null);
      }, 4000);
    }
  };

  // Pointer Down on Version Banner
  const handlePointerDown = () => {
    if (isCheckingUpdate || isDownloading || inlineStatus !== null || availableUpdate !== null) {
      return;
    }

    longPressFiredRef.current = false;
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    const duration = 4000; // 4 seconds

    // Smooth hold progress update
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setHoldProgress(progress);
    }, 50);

    // 4-second timer for secret beta check
    holdTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setIsHolding(false);
      setHoldProgress(0);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([40, 60, 80]);
        }
      } catch {}

      // Trigger beta check!
      executeUpdateCheck(true);
    }, duration);
  };

  // Pointer Up / Cancel
  const handlePointerUp = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    setIsHolding(false);
    setHoldProgress(0);

    // If hold didn't reach 4 seconds, trigger regular stable update check
    if (!longPressFiredRef.current) {
      executeUpdateCheck(false);
    }
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setIsHolding(false);
    setHoldProgress(0);
    longPressFiredRef.current = false;
  };

  const handleStartDownload = async () => {
    if (!availableUpdate) return;
    const downloadUrl = availableUpdate.apkUrl || availableUpdate.releaseUrl;
    if (!downloadUrl) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatusText(
      lang === 'en' ? 'Starting download...' : 'Початок завантаження...'
    );

    const result = await NativeUpdate.downloadAndInstall(
      downloadUrl,
      availableUpdate.latestVersion,
      (percent) => {
        setDownloadProgress(percent);
        setDownloadStatusText(
          lang === 'en'
            ? `Downloading: ${percent}%`
            : `Завантаження: ${percent}%`
        );
      }
    );

    if (result.success) {
      setDownloadProgress(100);
      setDownloadStatusText(
        lang === 'en'
          ? 'Download complete! Opening installer...'
          : 'Завантаження завершено! Відкриття...'
      );
      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 3500);
    } else {
      setIsDownloading(false);
      setDownloadProgress(null);
      setInlineStatus({
        type: 'error',
        text: result.error || (lang === 'en' ? 'Download failed' : 'Помилка завантаження'),
      });
    }
  };

  // Pop!_OS COSMIC Style 2-stage unfolding variants (expands horizontally first, then downwards)
  const popOsMorphVariants = {
    hidden: {
      opacity: 0,
      scaleX: 0.1,
      scaleY: 0.04,
      y: -14,
      transformOrigin: 'calc(100% - 24px) 16px',
    },
    visible: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      y: 0,
      transformOrigin: 'calc(100% - 24px) 16px',
      transition: {
        scaleX: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
        scaleY: { delay: 0.15, duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
        opacity: { duration: 0.16 },
        y: { duration: 0.2 },
      },
    },
    exit: {
      scaleY: 0.05,
      scaleX: 0.12,
      opacity: 0,
      y: -12,
      transformOrigin: 'calc(100% - 24px) 16px',
      transition: {
        scaleY: { duration: 0.18, ease: [0.7, 0, 0.84, 0] as const },
        scaleX: { delay: 0.12, duration: 0.18, ease: [0.7, 0, 0.84, 0] as const },
        opacity: { delay: 0.16, duration: 0.14 },
      },
    },
  };

  const popOsContentVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.22, duration: 0.28, ease: 'easeOut' as const },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.12 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-start px-4 pb-6 overflow-hidden"
          style={{
            paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 24px)',
          }}
        >
          {/* Smooth Pop!_OS Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />

          {/* Pop!_OS Frosted Glass Window: Expands horizontally, then unfolds downward */}
          <motion.div
            variants={popOsMorphVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md rounded-3xl bg-[#0d121f]/85 backdrop-blur-3xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22),0_24px_65px_rgba(0,0,0,0.92)] flex flex-col gap-4 max-h-[85vh] overflow-y-auto text-white z-10 will-change-transform"
          >
            <motion.div
              variants={popOsContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-4 w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white font-bold">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide">NUMO Radio</h2>
                    <p className="text-[11px] text-slate-400">Electronic & Ambient Stream</p>
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

            {/* Donate / Support Section */}
            <div className="flex flex-col gap-2 pt-0.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                    {lang === 'en' ? 'Donate' : 'Підтримати'}
                  </h3>
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500 animate-pulse inline-block flex-shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {lang === 'en'
                    ? 'For project development and server & infrastructure maintenance'
                    : 'Для розвитку проєкту та підтримки інфраструктури і серверів'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Monobank Button */}
                <button
                  type="button"
                  onClick={handleOpenMonobank}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-zinc-950 hover:bg-black text-white font-bold text-xs border border-white/20 hover:border-white/35 shadow-lg shadow-black/50 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="px-1.5 py-0.5 rounded bg-white text-black font-black text-[10px] tracking-tight leading-none uppercase">
                    mono
                  </span>
                  <span className="tracking-tight">monobank</span>
                </button>

                {/* PayPal Button */}
                <button
                  type="button"
                  onClick={handleOpenPayPal}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#003087] hover:bg-[#00256b] text-white font-bold text-xs border border-[#0079c1]/40 shadow-lg shadow-blue-950/50 transition-all active:scale-95 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none">
                    <path
                      d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.858A.842.842 0 0 1 5.776 2.2h6.81c2.254 0 4.02.578 4.975 1.625.86 1.037.935 2.502.218 4.354-.047.12-.098.24-.153.36-1.127 2.45-3.08 3.693-5.807 3.693H9.278a.842.842 0 0 0-.832.709l-.865 5.485a.641.641 0 0 1-.633.541l.128-.13z"
                      fill="#0079C1"
                    />
                    <path
                      d="M17.409 8.179c-.047.12-.098.24-.153.36-1.127 2.45-3.08 3.693-5.807 3.693H8.908a.842.842 0 0 0-.832.709l-1.173 7.44a.534.534 0 0 0 .528.618h3.844a.702.702 0 0 0 .693-.591l.808-5.125a.842.842 0 0 1 .832-.709h1.76c2.727 0 4.68-1.243 5.807-3.693.717-1.852.642-3.317-.218-4.354a4.116 4.116 0 0 0-.548-.548z"
                      fill="#00457C"
                    />
                    <path
                      d="M16.861 7.631a5.352 5.352 0 0 0-.605-.452c-.955-1.047-2.72-1.625-4.975-1.625H6.471a.842.842 0 0 0-.832.658L4.316 14.88h3.385l.865-5.485a.842.842 0 0 1 .832-.709h2.541c2.727 0 4.68-1.243 5.807-3.693.055-.12.106-.24.153-.36l-.038-.002z"
                      fill="#0079C1"
                    />
                  </svg>
                  <span className="tracking-tight">PayPal</span>
                </button>
              </div>
            </div>

            {/* Server Selector Section (Single Horizontal Row matching Monobank & PayPal) */}
            <div className="flex flex-col gap-2 pt-0.5 select-none">
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                  {lang === 'en' ? 'Server' : 'Сервер'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-0.5">
                {STREAM_SERVERS.map((server) => {
                  const isSelected = selectedServer === server.id;
                  return (
                    <button
                      key={server.id}
                      type="button"
                      onClick={() => onSelectServer?.(server.id)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold text-xs border shadow-lg transition-all active:scale-95 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/30 via-sky-500/25 to-indigo-600/30 border-cyan-400 text-cyan-200 shadow-cyan-950/60 ring-1 ring-cyan-400/50'
                          : 'bg-zinc-950 hover:bg-black border-white/20 text-slate-300 hover:text-white shadow-black/50'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isSelected ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                      <span className="tracking-tight uppercase">{server.id === 'server1' ? 'MP3' : 'HLS'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Radio Station Philosophy & Story */}
            <div className="flex flex-col gap-2.5 rounded-2xl bg-white/[0.05] border border-white/10 p-4 shadow-inner">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  {lang === 'en' ? 'About NUMO Radio' : 'Про NUMO Radio'}
                </h3>
              </div>

              {/* Story Description */}
              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p>
                  {lang === 'en'
                    ? 'NUMO Radio is an independent atmospheric sound station created for those who value deep soundscapes, focus, and nocturnal aesthetics.'
                    : 'NUMO Radio — це незалежна атмосферна звукова станція, створена для тих, хто цінує глибокі вайби, творчий фокус та естетику нічного розслаблення.'}
                </p>
                <p className="text-slate-400 text-[11px]">
                  {lang === 'en'
                    ? 'Broadcasting 24/7 Deep House, Atmospheric Organic Beats, Chill, and Electronic gems from Ukrainian and global producers. Zero ads, zero talk shows — pure continuous music flow.'
                    : 'Цілодобовий ефір Deep House, Organic Beats, Chill та електронних шедеврів від українських і світових продюсерів. Без реклами та розмов — лише чистий музичний потік.'}
                </p>
              </div>
            </div>

            {/* App Version Row: Клікабельний банер із 4-секундним утриманням для бета-версій */}
            <div className="flex flex-col gap-2 pt-1 select-none">
              <button
                type="button"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerCancel}
                disabled={isCheckingUpdate || isDownloading || inlineStatus !== null}
                aria-label="App Version"
                className={`relative w-full py-3 px-4 rounded-2xl border transition-all overflow-hidden flex items-center justify-between text-xs select-none touch-manipulation ${
                  isCheckingUpdate
                    ? isBetaChecking
                      ? 'bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-violet-950/90 border-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.4)] ring-1 ring-violet-400/60'
                      : 'bg-gradient-to-r from-emerald-950/80 via-teal-950/75 to-cyan-950/80 border-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/50'
                    : isHolding
                    ? 'bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-violet-950/50 border-violet-500/60 scale-[0.99]'
                    : inlineStatus !== null
                    ? 'bg-white/[0.04] border-white/10 opacity-75 cursor-default'
                    : 'bg-white/[0.05] hover:bg-white/[0.09] active:bg-white/[0.12] border-white/10 cursor-pointer'
                }`}
              >
                {/* 4-секундний індикатор утримання для бета-тесту */}
                {isHolding && (
                  <div
                    className="absolute left-0 bottom-0 top-0 bg-gradient-to-r from-violet-600/35 via-purple-500/35 to-indigo-500/35 pointer-events-none transition-all ease-linear"
                    style={{ width: `${holdProgress}%` }}
                  />
                )}

                {/* Анімований перелив світла по всьому банеру під час перевірки */}
                {isCheckingUpdate && (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                    className={`absolute inset-0 pointer-events-none ${
                      isBetaChecking
                        ? 'bg-gradient-to-r from-transparent via-violet-400/35 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent'
                    }`}
                  />
                )}

                {/* Пульсуючий фон під час перевірки */}
                {isCheckingUpdate && (
                  <div
                    className={`absolute inset-0 animate-pulse pointer-events-none ${
                      isBetaChecking ? 'bg-violet-500/15' : 'bg-emerald-500/10'
                    }`}
                  />
                )}

                {/* Ліворуч: Версія додатку */}
                <div className="relative z-10 flex items-center gap-2 min-w-0 leading-none">
                  {isBetaChecking ? (
                    <FlaskConical className="w-4 h-4 text-violet-300 flex-shrink-0 animate-pulse" />
                  ) : isCurrentBeta ? (
                    <FlaskConical className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  ) : (
                    <Sparkles
                      className={`w-4 h-4 text-emerald-400 flex-shrink-0 transition-transform ${
                        isCheckingUpdate ? 'animate-spin' : ''
                      }`}
                    />
                  )}
                  <span className="text-slate-300 font-medium text-xs leading-none">
                    {isBetaChecking
                      ? lang === 'en'
                        ? 'Checking Beta...'
                        : 'Пошук бета-релізів...'
                      : lang === 'en'
                      ? 'App version'
                      : 'Версія додатку'}
                  </span>
                </div>

                {/* Праворуч: Номер версії (якщо бета — показується бейдж beta та версія) */}
                <div className="relative z-10 flex items-center gap-2 flex-shrink-0 leading-none">
                  {isCheckingUpdate && (
                    <RefreshCw
                      className={`w-3.5 h-3.5 animate-spin ${
                        isBetaChecking ? 'text-violet-300' : 'text-emerald-300'
                      }`}
                    />
                  )}
                  {isCurrentBeta && (
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-violet-500/25 text-violet-300 border border-violet-500/40 tracking-wider">
                      beta
                    </span>
                  )}
                  <span className="font-mono text-xs font-semibold text-slate-300 tracking-wide leading-none">
                    v{currentVersion}
                  </span>
                </div>
              </button>

              {/* Плавна поява вікна "У вас остання версія" */}
              <AnimatePresence>
                {inlineStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -14, scaleY: 0.85, height: 0 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, scaleY: 0.9, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden origin-top"
                  >
                    <div
                      className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold shadow-lg shadow-black/40 ${
                        inlineStatus.type === 'beta'
                          ? 'bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-violet-950/90 border border-violet-500/40 text-violet-300'
                          : inlineStatus.type === 'success'
                          ? 'bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-cyan-950/90 border border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                      }`}
                    >
                      {inlineStatus.type === 'beta' ? (
                        <FlaskConical className="w-4 h-4 text-violet-300 flex-shrink-0" />
                      ) : inlineStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                      <span className="leading-tight">{inlineStatus.text}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Плавне розкриття вниз рядка оновлення, якщо є нова версія (стабільна чи бета) */}
              <AnimatePresence>
                {availableUpdate && (
                  <motion.div
                    initial={{ opacity: 0, y: -14, scaleY: 0.85, height: 0 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, scaleY: 0.9, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden origin-top"
                  >
                    <button
                      type="button"
                      onClick={handleStartDownload}
                      disabled={isDownloading}
                      className={`w-full flex flex-col gap-2.5 p-3.5 rounded-2xl border text-white shadow-lg shadow-black/40 text-left transition-all active:scale-[0.98] select-none ${
                        isDownloading
                          ? 'cursor-default'
                          : 'cursor-pointer hover:opacity-95'
                      } ${
                        availableUpdate.isPrerelease
                          ? 'bg-gradient-to-br from-indigo-950/85 via-purple-950/75 to-violet-950/85 border-violet-500/50 shadow-violet-950/60'
                          : 'bg-gradient-to-br from-emerald-950/85 via-teal-950/75 to-cyan-950/85 border-emerald-500/45 shadow-emerald-950/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 w-full">
                        {/* Left: New version title */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              availableUpdate.isPrerelease
                                ? 'bg-violet-500/25 text-violet-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {availableUpdate.isPrerelease ? (
                              <FlaskConical className="w-4 h-4" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-snug">
                              {availableUpdate.isPrerelease ? (
                                <span className="text-violet-200">
                                  {lang === 'en' ? 'New Beta Available' : 'Доступна нова бета-версія'}
                                </span>
                              ) : (
                                <span className="text-emerald-200">
                                  {lang === 'en' ? 'New Version Available' : 'Доступна нова версія'}
                                </span>
                              )}
                            </p>
                            <p
                              className={`text-[11px] font-mono mt-0.5 font-bold ${
                                availableUpdate.isPrerelease
                                  ? 'text-violet-300'
                                  : 'text-emerald-300'
                              }`}
                            >
                              {availableUpdate.displayVersion}
                            </p>
                          </div>
                        </div>

                        {/* Right: Download icon cue */}
                        {!isDownloading && (
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                              availableUpdate.isPrerelease
                                ? 'bg-violet-500/30 text-violet-200 border border-violet-400/30'
                                : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                            }`}
                          >
                            <ArrowDownCircle className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      {/* Status & Progress Bar during download */}
                      {isDownloading && (
                        <div className="flex flex-col gap-1.5 pt-1 w-full">
                          <div
                            className={`flex items-center justify-between text-[11px] font-semibold ${
                              availableUpdate.isPrerelease ? 'text-violet-300' : 'text-emerald-300'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Loader2
                                className={`w-3.5 h-3.5 animate-spin flex-shrink-0 ${
                                  availableUpdate.isPrerelease
                                    ? 'text-violet-400'
                                    : 'text-emerald-400'
                                }`}
                              />
                              {downloadStatusText}
                            </span>
                            {downloadProgress !== null && (
                              <span className="font-mono font-bold flex-shrink-0">
                                {downloadProgress}%
                              </span>
                            )}
                          </div>
                          {/* Animated Progress Bar */}
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
                            <div
                              className={`h-full transition-all duration-200 ease-out ${
                                availableUpdate.isPrerelease
                                  ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400'
                                  : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400'
                              }`}
                              style={{ width: `${downloadProgress ?? 10}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs transition-colors text-center cursor-pointer mt-1"
            >
              {t.close}
            </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
