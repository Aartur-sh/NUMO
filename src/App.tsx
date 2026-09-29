import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { useNowPlaying } from './hooks/useNowPlaying';
import { useRadioStream } from './hooks/useRadioStream';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Header } from './components/Header';
import { Artwork } from './components/Artwork';
import { TrackInfo } from './components/TrackInfo';
import { NextTrackCard } from './components/NextTrackCard';
import { Controls } from './components/Controls';
import { InfoModal } from './components/InfoModal';
import { HistoryModal } from './components/HistoryModal';
import { UpdateModal } from './components/UpdateModal';
import { SplashScreen } from './components/SplashScreen';
import { checkForAppUpdate, type AppReleaseInfo } from './services/updateService';
import { getInitialLanguage, type Language } from './i18n';

export default function App() {
  const [lang, setLang] = useState<Language>(getInitialLanguage);

  const toggleLang = () => {
    const nextLang = lang === 'uk' ? 'en' : 'uk';
    setLang(nextLang);
    localStorage.setItem('soma_lang', nextLang);
  };

  const { data, localElapsed, isOnline, isLoading: isDataLoading } = useNowPlaying();
  const currentSong = data?.now_playing?.song;

  // App Update states
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [releaseInfo, setReleaseInfo] = useState<AppReleaseInfo | null>(null);

  // Hide status bar on native mobile app for immersive fullscreen
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.hide().catch(() => {});
    }
  }, []);

  // Check for app updates on launch (silent)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const info = await checkForAppUpdate();
        if (info.hasUpdate) {
          setReleaseInfo(info);
          setIsUpdateModalOpen(true);
        }
      } catch {
        // Silently ignore startup errors (offline, initial run, etc.)
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const {
    isPlaying,
    isLoading: isAudioLoading,
    isBuffering,
    volume,
    isMuted,
    error: audioError,
    togglePlay,
    pause,
    setVolume,
    toggleMute,
  } = useRadioStream(currentSong);

  // Sleep Timer state
  const [sleepMinutes, setSleepMinutes] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds > 0]);

  useEffect(() => {
    if (remainingSeconds === 0 && sleepMinutes > 0) {
      pause();
      setSleepMinutes(0);
    }
  }, [remainingSeconds, sleepMinutes, pause]);

  const startSleepTimer = (mins: number) => {
    setSleepMinutes(mins);
    if (mins === 0) {
      setRemainingSeconds(0);
    } else {
      setRemainingSeconds(mins * 60);
    }
  };

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const listenersCount = data?.listeners?.current ?? 0;
  const songTitle = currentSong?.title || currentSong?.text || 'NUMO Radio';
  const songArtist = currentSong?.artist || '';
  const songArt = currentSong?.art;
  const totalDuration = data?.now_playing?.duration || 0;
  const playingNext = data?.playing_next || null;
  const bitrate = data?.station?.mounts?.[0]?.bitrate || 192;

  return (
    <div
      className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col items-center text-slate-100 px-4 pb-[max(env(safe-area-inset-bottom,0px),10px)] overscroll-none select-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
      }}
    >
      {/* Animated Aurora Gradient Background */}
      <AnimatedBackground isPlaying={isPlaying} />

      {/* Explicit DOM Audio player for Android WebView hardware engine */}
      <audio id="numo-audio-player" playsInline preload="none" aria-hidden="true" className="hidden" />

      {/* 1. Header (height x): Attached to top */}
      <div className="w-full max-w-md flex-shrink-0 z-30">
        <Header
          isOnline={isOnline}
          isPlaying={isPlaying}
          listenersCount={listenersCount}
          lang={lang}
          onToggleLang={toggleLang}
          onOpenInfo={() => setIsInfoOpen(true)}
          sleepMinutes={sleepMinutes}
          remainingSeconds={remainingSeconds}
          onStartSleepTimer={startSleepTimer}
          hasUpdate={!!releaseInfo?.hasUpdate}
        />
      </div>

      {/* Dynamic Zone 1: Free space between Header and Artwork */}
      <div className="flex-1 min-h-2 w-full pointer-events-none" aria-hidden="true" />

      {/* 2 & 3. Cover Artwork (height y) + Track Info & Next Track (height h) */}
      <div className="relative z-10 w-full max-w-md flex-shrink-0 flex flex-col items-center">
        {/* Cover Artwork */}
        <div className="w-full flex items-center justify-center min-h-0">
          <Artwork
            artUrl={songArt}
            songTitle={songTitle}
            artistName={songArtist}
            isPlaying={isPlaying}
            isBuffering={isBuffering || isAudioLoading}
          />
        </div>

        {/* Track Title, Progress & Next Track */}
        <div className="w-full flex flex-col items-center mt-2 sm:mt-2.5">
          <TrackInfo
            title={songTitle}
            artist={songArtist}
            elapsedSeconds={localElapsed}
            totalDuration={totalDuration}
            isPlaying={isPlaying}
          />

          <div className="mt-2 sm:mt-2.5 w-full">
            <NextTrackCard playingNext={playingNext} lang={lang} />
          </div>
        </div>
      </div>

      {/* Dynamic Zone 2: Free space between Next Track and Controls */}
      <div className="flex-1 min-h-2 w-full pointer-events-none" aria-hidden="true" />

      {/* 4. Controls Banner (height i) */}
      <div className="relative z-10 w-full max-w-md flex-shrink-0">
        {audioError && (
          <button
            type="button"
            onClick={togglePlay}
            className="w-full mb-2 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-semibold text-center cursor-pointer transition-colors active:scale-98"
          >
            {audioError}
          </button>
        )}

        <Controls
          isPlaying={isPlaying}
          isLoading={isAudioLoading}
          isBuffering={isBuffering}
          volume={volume}
          isMuted={isMuted}
          onTogglePlay={togglePlay}
          onPause={pause}
          onSetVolume={setVolume}
          onToggleMute={toggleMute}
          onOpenHistory={() => setIsHistoryOpen(true)}
          bitrate={bitrate}
          lang={lang}
        />
      </div>

      {/* Dynamic Zone 3: Free space between Controls and screen bottom edge */}
      <div className="flex-1 min-h-2 w-full pointer-events-none" aria-hidden="true" />

      {/* Animated App Intro Splash Screen */}
      <SplashScreen />

      {/* History Dialog: Recently Played Tracks with timestamps & artwork */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        data={data}
        lang={lang}
      />

      {/* Info Dialog: App Version, Support Project (Monobank & PayPal) */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        data={data}
        lang={lang}
        releaseInfo={releaseInfo}
        onOpenUpdateModal={() => {
          setIsInfoOpen(false);
          setIsUpdateModalOpen(true);
        }}
      />

      {/* GitHub Releases App Update Dialog */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        releaseInfo={releaseInfo}
        lang={lang}
      />
    </div>
  );
}
