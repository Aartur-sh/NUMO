import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import type { Song } from '../types';

export type ServerId = 'server1' | 'server2';

export interface ServerOption {
  id: ServerId;
  nameUk: string;
  nameEn: string;
  url: string;
  descUk: string;
  descEn: string;
}

export const STREAM_SERVERS: ServerOption[] = [
  {
    id: 'server1',
    nameUk: 'MP3',
    nameEn: 'MP3',
    url: 'https://numo.pp.ua/icecast/stream',
    descUk: 'Icecast MP3 • Потік',
    descEn: 'Icecast MP3 • Stream',
  },
  {
    id: 'server2',
    nameUk: 'HLS',
    nameEn: 'HLS',
    url: 'https://numo.pp.ua/hls/live.m3u8',
    descUk: 'HLS Live • Потік',
    descEn: 'HLS Live • Stream',
  },
];

const getInitialVolume = (): number => {
  try {
    const saved = localStorage.getItem('numo_radio_volume');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch {}
  return 1.0;
};

const getInitialMuted = (): boolean => {
  try {
    return localStorage.getItem('numo_radio_muted') === 'true';
  } catch {
    return false;
  }
};

const getInitialServer = (): ServerId => {
  try {
    const saved = localStorage.getItem('numo_selected_server');
    if (saved === 'server2') return 'server2';
  } catch {}
  return 'server1';
};

const toAbsoluteUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
};

export function useRadioStream(currentSong?: Song) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const intentStateRef = useRef<'playing' | 'paused'>('paused');
  const activePlayPromiseRef = useRef<Promise<void> | null>(null);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState<number>(getInitialVolume);
  const [isMuted, setIsMuted] = useState<boolean>(getInitialMuted);
  const [selectedServer, setSelectedServer] = useState<ServerId>(getInitialServer);
  const selectedServerRef = useRef<ServerId>(selectedServer);
  useEffect(() => {
    selectedServerRef.current = selectedServer;
  }, [selectedServer]);
  const [error, setError] = useState<string | null>(null);

  const getActiveServerUrl = useCallback((serverId: ServerId) => {
    const opt = STREAM_SERVERS.find((s) => s.id === serverId);
    return opt ? opt.url : STREAM_SERVERS[0].url;
  }, []);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
  }, []);

  // Initialize DOM audio player with pre-warmed connection
  useEffect(() => {
    let audio = document.getElementById('numo-audio-player') as HTMLAudioElement;
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'numo-audio-player';
      audio.preload = 'auto';
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      document.body.appendChild(audio);
    } else {
      audio.preload = 'auto';
    }

    // Pre-warm Icecast stream socket for instant connection on play
    if (!audio.src && selectedServerRef.current === 'server1') {
      audio.src = STREAM_SERVERS[0].url;
      try {
        audio.load();
      } catch {}
    }

    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const handleWaiting = () => {
      if (intentStateRef.current === 'playing') {
        setIsBuffering(true);
      }
    };

    const handlePlaying = () => {
      if (intentStateRef.current !== 'playing') {
        audio.pause();
        return;
      }
      isPlayingRef.current = true;
      setIsPlaying(true);
      setIsLoading(false);
      setIsBuffering(false);
      setError(null);
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'playing';
        } catch {}
      }
    };

    const handlePause = () => {
      if (intentStateRef.current === 'paused') {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setIsLoading(false);
        setIsBuffering(false);
        if ('mediaSession' in navigator) {
          try {
            navigator.mediaSession.playbackState = 'paused';
          } catch {}
        }
      }
    };

    const handleError = () => {
      const audioEl = audioRef.current;
      if (!audioEl || intentStateRef.current !== 'playing') return;

      // Ignore aborted error during source switches or detaches
      if (audioEl.error && audioEl.error.code === 1) return;

      // If Hls.js is active, it handles stream network and media recovery on its own
      if (hlsRef.current) return;

      console.warn('Audio stream error event:', audioEl.error?.code, audioEl.error?.message);

      intentStateRef.current = 'paused';
      isPlayingRef.current = false;
      setIsLoading(false);
      setIsBuffering(false);
      setIsPlaying(false);
      setError('Помилка підключення до сервера. Натисніть Play для повтору.');
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && intentStateRef.current === 'playing') {
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      }
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      destroyHls();
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [destroyHls]);

  const play = useCallback((targetServerId?: ServerId) => {
    let audio = audioRef.current;
    if (!audio) {
      audio = document.getElementById('numo-audio-player') as HTMLAudioElement;
      if (audio) audioRef.current = audio;
    }
    if (!audio) return;

    intentStateRef.current = 'playing';
    setIsPlaying(true);
    setIsLoading(true);
    setError(null);
    isPlayingRef.current = true;

    const activeServer = targetServerId || selectedServerRef.current;
    const targetUrl = getActiveServerUrl(activeServer);
    const isHlsStream = targetUrl.endsWith('.m3u8') || targetUrl.includes('/hls/');

    audio.volume = isMuted ? 0 : volume;

    // For HLS streams: prioritize Hls.js first (Chrome, Edge, Firefox, Android), else fallback to native Safari HLS
    if (isHlsStream) {
      if (Hls.isSupported()) {
        destroyHls();

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          liveSyncDurationCount: 3,
        });

        hlsRef.current = hls;
        hls.attachMedia(audio);
        hls.loadSource(targetUrl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (intentStateRef.current !== 'playing') return;
          const p = audio?.play();
          if (p) {
            activePlayPromiseRef.current = p;
            p.then(() => {
              if (intentStateRef.current === 'playing') {
                setIsPlaying(true);
                setIsLoading(false);
                setIsBuffering(false);
                setError(null);
              } else {
                audio?.pause();
              }
            }).catch((err) => {
              if (err?.name === 'AbortError') return;
              console.warn('HLS play rejected:', err);
              if (intentStateRef.current === 'playing') {
                intentStateRef.current = 'paused';
                isPlayingRef.current = false;
                setIsLoading(false);
                setIsPlaying(false);
                setError('Помилка відтворення HLS потоку. Натисніть Play для повтору.');
              }
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.warn('HLS fatal error:', data.type);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                destroyHls();
                intentStateRef.current = 'paused';
                isPlayingRef.current = false;
                setIsPlaying(false);
                setIsLoading(false);
                setError('Помилка підключення до HLS сервера.');
                break;
            }
          }
        });
        return;
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // iOS Safari native HLS
        destroyHls();
        if (audio.src !== targetUrl) {
          audio.src = targetUrl;
          audio.load();
        }

        const p = audio.play();
        if (p) {
          activePlayPromiseRef.current = p;
          p.then(() => {
            if (intentStateRef.current === 'playing') {
              setIsPlaying(true);
              setIsLoading(false);
              setIsBuffering(false);
              setError(null);
            } else {
              audio?.pause();
            }
          }).catch((err: any) => {
            if (err?.name === 'AbortError') return;
            console.warn('Native HLS play rejected:', err);
            if (intentStateRef.current === 'playing') {
              intentStateRef.current = 'paused';
              isPlayingRef.current = false;
              setIsLoading(false);
              setIsPlaying(false);
              setError('Помилка відтворення. Натисніть Play для повтору.');
            }
          });
        }
        return;
      }
    }

    // Native HLS (Safari/iOS) or Direct MP3 Icecast
    destroyHls();
    if (!audio.src || audio.src !== targetUrl) {
      audio.src = targetUrl;
    } else if (audio.buffered.length > 0) {
      try {
        const liveEnd = audio.buffered.end(audio.buffered.length - 1);
        if (liveEnd > audio.currentTime + 3) {
          audio.currentTime = liveEnd;
        }
      } catch {}
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      activePlayPromiseRef.current = playPromise;
      playPromise
        .then(() => {
          if (intentStateRef.current === 'playing') {
            setIsPlaying(true);
            setIsLoading(false);
            setIsBuffering(false);
            setError(null);
            if ('mediaSession' in navigator) {
              try {
                navigator.mediaSession.playbackState = 'playing';
              } catch {}
            }
          } else {
            audio?.pause();
          }
        })
        .catch((err: any) => {
          if (err?.name === 'AbortError') return;
          console.warn('Playback request rejected:', err?.name, err?.message);
          if (intentStateRef.current === 'playing') {
            intentStateRef.current = 'paused';
            isPlayingRef.current = false;
            setIsLoading(false);
            setIsPlaying(false);
            setIsBuffering(false);
            setError('Помилка відтворення. Натисніть Play для повтору.');
          }
        });
    }
  }, [volume, isMuted, getActiveServerUrl, destroyHls]);

  const pause = useCallback(() => {
    intentStateRef.current = 'paused';
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsLoading(false);
    setIsBuffering(false);
    destroyHls();

    const audio = audioRef.current;
    if (audio) {
      if (activePlayPromiseRef.current) {
        activePlayPromiseRef.current.finally(() => {
          if (intentStateRef.current === 'paused') {
            audio.pause();
          }
        });
      } else {
        audio.pause();
      }
    }

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch {}
    }
  }, [destroyHls]);

  // Update MediaSession on track or play state change for Android Lockscreen & Notification Banner
  useEffect(() => {
    if ('mediaSession' in navigator) {
      const title = currentSong?.title || 'NUMO Radio';
      const artist = currentSong?.artist || 'Electronic & Ambient';
      const album = currentSong?.album || 'NUMO Live Stream';
      const rawArt = currentSong?.art && currentSong.art.length > 5
        ? currentSong.art
        : '/pwa-512x512.png';

      const artUrl = toAbsoluteUrl(rawArt);
      const fallbackArt = toAbsoluteUrl('/pwa-512x512.png');
      const icon192 = toAbsoluteUrl('/pwa-192x192.png');

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album,
          artwork: [
            { src: artUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: artUrl, sizes: '384x384', type: 'image/jpeg' },
            { src: artUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: icon192, sizes: '192x192', type: 'image/png' },
            { src: fallbackArt, sizes: '512x512', type: 'image/png' },
          ],
        });
      } catch (err) {
        console.debug('MediaMetadata error:', err);
      }

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      try {
        navigator.mediaSession.setActionHandler('play', () => { play(); });
        navigator.mediaSession.setActionHandler('pause', () => { pause(); });
        navigator.mediaSession.setActionHandler('stop', () => { pause(); });
        // Providing previoustrack and nexttrack enables the full MediaStyle lockscreen card on Android
        navigator.mediaSession.setActionHandler('previoustrack', () => { play(); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { play(); });
      } catch (e) {}
    }
  }, [currentSong, isPlaying, play, pause]);

  const selectServer = useCallback((serverId: ServerId) => {
    setSelectedServer(serverId);
    selectedServerRef.current = serverId;
    try {
      localStorage.setItem('numo_selected_server', serverId);
    } catch {}

    const wasPlaying = isPlayingRef.current;
    pause();

    if (wasPlaying) {
      play(serverId);
    }
  }, [pause, play]);

  const togglePlay = useCallback(() => {
    setError(null);
    if (intentStateRef.current === 'playing') {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    try {
      localStorage.setItem('numo_radio_volume', String(clamped));
    } catch {}
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      try {
        localStorage.setItem('numo_radio_muted', 'false');
      } catch {}
    }
  }, [isMuted]);

  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem('numo_radio_muted', String(nextMuted));
    } catch {}

    if (!audio) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const startVol = audio.volume;
    const targetVol = nextMuted ? 0 : volume;
    const duration = 200;
    const steps = 10;
    const stepTime = duration / steps;
    let stepCount = 0;

    fadeIntervalRef.current = setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      const current = startVol + (targetVol - startVol) * progress;
      audio.volume = Math.max(0, Math.min(1, current));

      if (stepCount >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        audio.volume = targetVol;
      }
    }, stepTime);
  }, [isMuted, volume]);

  return {
    isPlaying,
    isLoading,
    isBuffering,
    volume,
    isMuted,
    selectedServer,
    selectServer,
    error,
    togglePlay,
    play,
    pause,
    setVolume,
    toggleMute,
  };
}
