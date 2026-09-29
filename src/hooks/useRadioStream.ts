import { useEffect, useRef, useState, useCallback } from 'react';
import type { Song } from '../types';

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
  return 1.0; // Максимальна гучність при першому запуску
};

const getInitialMuted = (): boolean => {
  try {
    return localStorage.getItem('numo_radio_muted') === 'true';
  } catch {
    return false;
  }
};

export function useRadioStream(currentSong?: Song) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState<number>(getInitialVolume);
  const [isMuted, setIsMuted] = useState<boolean>(getInitialMuted);
  const [error, setError] = useState<string | null>(null);

  const PRIMARY_STREAM = 'https://numo.pp.ua/listen/solo/radio.mp3';
  const FALLBACK_STREAM = 'http://numo.pp.ua/listen/solo/radio.mp3';

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

      // Try cleartext HTTP fallback if HTTPS encountered an SSL/Proxy issue
      if (audioEl.src.startsWith('https://')) {
        console.log('Switching to cleartext HTTP fallback...');
        audioEl.src = FALLBACK_STREAM;
        audioEl.play().catch((err) => {
          console.warn('Fallback stream failed:', err);
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

    // Set audio source if not already active
    if (!audio.src || !audio.src.includes('numo.pp.ua')) {
      audio.src = PRIMARY_STREAM;
    }

    audio.volume = isMuted ? 0 : volume;

    // Direct invocation without audio.load() which cancels playback in Chromium
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

          // If playback failed on primary stream, attempt fallback
          if (audio && audio.src !== FALLBACK_STREAM) {
            console.log('Attempting HTTP fallback after rejection...');
            audio.src = FALLBACK_STREAM;
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
  }, [volume, isMuted]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    isPlayingRef.current = false;
    const audio = audioRef.current;
    audio.pause();
    // Do NOT call audio.load() - just release src cleanly
    audio.removeAttribute('src');
    setIsPlaying(false);
    setIsLoading(false);
    setIsBuffering(false);
  }, []);

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
    const duration = 200; // 200ms smooth audio fade
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
    error,
    togglePlay,
    pause,
    setVolume,
    toggleMute,
  };
}
