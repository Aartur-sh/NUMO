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

  // Initialize DOM audio player
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
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'playing';
        } catch {}
      }
    };

    const handlePause = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsLoading(false);
      setIsBuffering(false);
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'paused';
        } catch {}
      }
    };

    const handleError = () => {
      const audioEl = audioRef.current;
      if (!audioEl || !isPlayingRef.current) return;

      if (!audioEl.src || audioEl.src === '' || audioEl.src === window.location.href) {
        return;
      }

      console.warn('Audio stream error event:', audioEl.error?.code, audioEl.error?.message);

      // Do NOT switch servers automatically! Stay on selected server and report error
      isPlayingRef.current = false;
      setIsLoading(false);
      setIsBuffering(false);
      setIsPlaying(false);
      setError('Помилка підключення до сервера. Натисніть Play для повтору.');
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
    };
  }, [selectedServer, getActiveServerUrl]);

  // Update MediaSession on track or play state change for Android Lockscreen & Notification Banner
  useEffect(() => {
    if ('mediaSession' in navigator) {
      const title = currentSong?.title || 'NUMO Radio';
      const artist = currentSong?.artist || 'Electronic & Ambient';
      const album = currentSong?.album || 'NUMO Live Stream';
      const artUrl = currentSong?.art && currentSong.art.length > 5
        ? currentSong.art
        : '/pwa-512x512.png';

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: artUrl, sizes: '512x512', type: 'image/jpeg' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => { play(); });
      navigator.mediaSession.setActionHandler('pause', () => { pause(); });
      navigator.mediaSession.setActionHandler('stop', () => { pause(); });
    }
  }, [currentSong, isPlaying]);

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
          if ('mediaSession' in navigator) {
            try {
              navigator.mediaSession.playbackState = 'playing';
            } catch {}
          }
        })
        .catch((err: any) => {
          console.warn('Playback request rejected:', err?.name, err?.message);
          if (err?.name === 'AbortError') return;

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
    setIsPlaying(false);
    setIsLoading(false);
    setIsBuffering(false);
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch {}
    }
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
    play,
    pause,
    setVolume,
    toggleMute,
  };
}
