import { useEffect, useRef, useState, useCallback } from 'react';
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
    nameUk: 'Основний сервер (HTTPS)',
    nameEn: 'Primary Server (HTTPS)',
    url: 'https://numo.pp.ua/listen/solo/radio.mp3',
    descUk: 'numo.pp.ua • HTTPS потік',
    descEn: 'numo.pp.ua • HTTPS Stream',
  },
  {
    id: 'server2',
    nameUk: 'Резервний сервер (IP)',
    nameEn: 'Backup Server (IP Direct)',
    url: 'http://144.24.190.71:8000/stream.m3u',
    descUk: '144.24.190.71:8000 • Прямий потік',
    descEn: '144.24.190.71:8000 • Direct Stream',
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

export function useRadioStream(currentSong?: Song) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState<number>(getInitialVolume);
  const [isMuted, setIsMuted] = useState<boolean>(getInitialMuted);
  const [selectedServer, setSelectedServer] = useState<ServerId>(getInitialServer);
  const [error, setError] = useState<string | null>(null);

  const getActiveServerUrl = useCallback((serverId: ServerId) => {
    const opt = STREAM_SERVERS.find((s) => s.id === serverId);
    return opt ? opt.url : STREAM_SERVERS[0].url;
  }, []);

  // Initialize or attach to real DOM audio element
  useEffect(() => {
    let audio = document.getElementById('numo-audio-player') as HTMLAudioElement;
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'numo-audio-player';
      audio.preload = 'none';
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      document.body.appendChild(audio);
    }
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const handleWaiting = () => {
      if (isPlayingRef.current) {
        setIsBuffering(true);
      }
    };

    const handlePlaying = () => {
      isPlayingRef.current = true;
      setIsPlaying(true);
      setIsLoading(false);
      setIsBuffering(false);
      setError(null);
    };

    const handlePause = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleError = () => {
      const audioEl = audioRef.current;
      if (!audioEl || !isPlayingRef.current) return;

      if (!audioEl.src || audioEl.src === '' || audioEl.src === window.location.href) {
        return;
      }

      const mediaError = audioEl.error;
      if (mediaError && mediaError.code === 1) {
        return;
      }

      console.warn('Audio stream error event:', mediaError?.code, mediaError?.message);

      // Try fallback stream on primary server error
      const fallbackUrl = STREAM_SERVERS[1].url;
      if (audioEl.src !== fallbackUrl) {
        console.log('Switching to backup server stream...');
        audioEl.src = fallbackUrl;
        audioEl.play().catch((err) => {
          console.warn('Backup stream failed:', err);
          isPlayingRef.current = false;
          setIsLoading(false);
          setIsBuffering(false);
          setIsPlaying(false);
          setError('Помилка завантаження потоку. Натисніть Play для повтору.');
        });
      } else {
        isPlayingRef.current = false;
        setIsLoading(false);
        setIsBuffering(false);
        setIsPlaying(false);
        setError('Помилка завантаження потоку. Натисніть Play для повтору.');
      }
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.removeAttribute('src');
    };
  }, []);

  // Update MediaSession on track change
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      const artUrl = currentSong.art
        ? (currentSong.art.startsWith('http') ? currentSong.art : `/api/radio/art?url=${encodeURIComponent(currentSong.art)}`)
        : '/pwa-512x512.png';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || 'NUMO Radio',
        artist: currentSong.artist || 'Online Stream',
        album: currentSong.album || 'NUMO Live',
        artwork: [
          { src: artUrl, sizes: '512x512', type: 'image/jpeg' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        pause();
      });
    }
  }, [currentSong]);

  const play = useCallback(() => {
    let audio = audioRef.current;
    if (!audio) {
      audio = document.getElementById('numo-audio-player') as HTMLAudioElement;
      if (audio) audioRef.current = audio;
    }
    if (!audio) return;

    setIsLoading(true);
    setError(null);
    isPlayingRef.current = true;

    const targetUrl = getActiveServerUrl(selectedServer);

    // Set audio source if not already active
    if (!audio.src || audio.src !== targetUrl) {
      audio.src = targetUrl;
    }

    audio.volume = isMuted ? 0 : volume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          setIsBuffering(false);
          setError(null);
        })
        .catch((err: any) => {
          console.warn('Playback request rejected:', err?.name, err?.message);
          if (err?.name === 'AbortError') {
            return;
          }

          const fallbackUrl = selectedServer === 'server1' ? STREAM_SERVERS[1].url : STREAM_SERVERS[0].url;
          if (audio && audio.src !== fallbackUrl) {
            console.log('Attempting server fallback after rejection...');
            audio.src = fallbackUrl;
            audio.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
                setIsBuffering(false);
                setError(null);
              })
              .catch(() => {
                isPlayingRef.current = false;
                setIsLoading(false);
                setIsPlaying(false);
                setIsBuffering(false);
                setError('Помилка відтворення. Натисніть Play для повтору.');
              });
            return;
          }

          isPlayingRef.current = false;
          setIsLoading(false);
          setIsPlaying(false);
          setIsBuffering(false);
          setError('Помилка відтворення. Натисніть Play для повтору.');
        });
    }
  }, [volume, isMuted, selectedServer, getActiveServerUrl]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    isPlayingRef.current = false;
    const audio = audioRef.current;
    audio.pause();
    audio.removeAttribute('src');
    setIsPlaying(false);
    setIsLoading(false);
    setIsBuffering(false);
  }, []);

  const selectServer = useCallback((serverId: ServerId) => {
    setSelectedServer(serverId);
    try {
      localStorage.setItem('numo_selected_server', serverId);
    } catch {}

    const targetUrl = getActiveServerUrl(serverId);
    const audio = audioRef.current;
    if (!audio) return;

    const wasPlaying = isPlayingRef.current;
    audio.pause();
    audio.src = targetUrl;

    if (wasPlaying) {
      setIsLoading(true);
      isPlayingRef.current = true;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          setIsBuffering(false);
          setError(null);
        })
        .catch((err) => {
          console.warn('Failed to play newly selected server:', err);
          isPlayingRef.current = false;
          setIsPlaying(false);
          setIsLoading(false);
          setError('Не вдалося підключитися до обраного сервера');
        });
    }
  }, [getActiveServerUrl]);

  const togglePlay = useCallback(() => {
    setError(null);
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

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
    pause,
    setVolume,
    toggleMute,
  };
}
