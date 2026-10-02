import { useEffect, useState, useRef, useCallback } from 'react';
import type { NowPlayingResponse, RawNowPlayingJson, SongHistoryItem } from '../types';

const HISTORY_STORAGE_KEY = 'numo_recent_tracks_v1';

function loadCachedHistory(): SongHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 10);
    }
  } catch {}
  return [];
}

function saveCachedHistory(items: SongHistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, 10)));
  } catch {}
}

export function useNowPlaying() {
  const [data, setData] = useState<NowPlayingResponse | null>(null);
  const [localElapsed, setLocalElapsed] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Server clock offset in seconds: serverTimeSec - clientTimeSec
  const serverClockOffsetRef = useRef<number>(0);
  const currentTrackIdRef = useRef<string | null>(null);
  const historyBufferRef = useRef<SongHistoryItem[]>(loadCachedHistory());
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNowPlaying = useCallback(async () => {
    // Abort any pending fetch to prevent racing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Direct cache-bypassing fetch to nowplaying.json
      const url = `https://numo.pp.ua/hls/nowplaying.json?_=${Date.now()}`;
      let res: Response;
      try {
        res = await fetch(url, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        // Fallback proxy fetch if direct fetch fails
        res = await fetch(`/api/radio/nowplaying?_=${Date.now()}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
      }

      // Calculate server clock offset from response 'Date' header
      const dateHeader = res.headers.get('date');
      if (dateHeader) {
        const serverTimeSec = new Date(dateHeader).getTime() / 1000;
        const clientTimeSec = Date.now() / 1000;
        if (!isNaN(serverTimeSec)) {
          serverClockOffsetRef.current = serverTimeSec - clientTimeSec;
        }
      }

      const rawJson: RawNowPlayingJson = await res.json();
      if (!rawJson || typeof rawJson !== 'object') return;
      if (!rawJson.title && !rawJson.artist) return;

      const title = rawJson.title ? rawJson.title.trim() : 'NUMO Radio';
      const artist = rawJson.artist ? rawJson.artist.trim() : '';
      const album = rawJson.album ? rawJson.album.trim() : '';
      const duration = typeof rawJson.duration === 'number' ? Math.max(0, rawJson.duration) : 0;
      const startedAt = typeof rawJson.started_at === 'number' ? rawJson.started_at : Date.now() / 1000;

      // Construct cover URL with cache-busting timestamp
      const coverFile = rawJson.cover ? rawJson.cover.trim() : '';
      const coverUrl = coverFile
        ? `https://numo.pp.ua/hls/${coverFile}?t=${startedAt}`
        : '';

      const trackId = `${artist}-${title}-${startedAt}`;

      // Update history buffer on track change
      if (trackId !== currentTrackIdRef.current) {
        currentTrackIdRef.current = trackId;

        const newItem: SongHistoryItem = {
          sh_id: startedAt,
          played_at: Math.floor(startedAt),
          duration: Math.round(duration),
          playlist: 'Live Stream',
          song: {
            id: trackId,
            text: artist ? `${artist} - ${title}` : title,
            artist,
            title,
            album,
            genre: 'Deep House / Melodic Techno',
            art: coverUrl,
          },
        };

        const updatedHistory = [newItem, ...historyBufferRef.current.filter((item) => item.song.id !== trackId)].slice(0, 10);
        historyBufferRef.current = updatedHistory;
        saveCachedHistory(updatedHistory);
      }

      // Compute current elapsed time using server clock offset
      const serverNow = Date.now() / 1000 + serverClockOffsetRef.current;
      const elapsed = duration > 0 ? Math.max(0, Math.min(duration, Math.floor(serverNow - startedAt))) : 0;
      setLocalElapsed(elapsed);

      const formattedResponse: NowPlayingResponse = {
        station: {
          id: 1,
          name: 'NUMO Radio',
          shortcode: 'numo',
          description: 'Deep Electronic Soundscapes',
          frontend: 'hls',
          backend: 'liquidsoap',
          timezone: 'Europe/Kyiv',
          listen_url: 'https://numo.pp.ua/hls/live.m3u8',
          url: 'https://numo.pp.ua',
        },
        listeners: { total: 1250, unique: 38, current: 42 },
        live: { is_live: true, streamer_name: '', broadcast_start: null, art: coverUrl },
        now_playing: {
          sh_id: Math.floor(startedAt),
          played_at: Math.floor(startedAt),
          duration: Math.round(duration),
          playlist: 'Live Stream',
          streamer: '',
          is_request: false,
          elapsed,
          remaining: duration > 0 ? Math.max(0, Math.round(duration - elapsed)) : 0,
          song: {
            id: trackId,
            text: artist ? `${artist} - ${title}` : title,
            artist,
            title,
            album,
            genre: 'Deep House / Melodic Techno',
            art: coverUrl,
          },
        },
        playing_next: null,
        song_history: historyBufferRef.current,
        is_online: true,
      };

      setData(formattedResponse);
      setIsOnline(true);
      setIsLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setIsLoading(false);
    }
  }, []);

  // Adaptive polling: 3s when active/visible, 12s when hidden/minimized to preserve battery
  useEffect(() => {
    fetchNowPlaying();

    let intervalId: ReturnType<typeof setInterval>;

    const resetInterval = () => {
      clearInterval(intervalId);
      const intervalMs = document.visibilityState === 'visible' ? 3000 : 12000;
      intervalId = setInterval(fetchNowPlaying, intervalMs);
    };

    resetInterval();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNowPlaying();
      }
      resetInterval();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchNowPlaying]);

  // Smooth 1-second elapsed increment
  useEffect(() => {
    const timer = setInterval(() => {
      if (!data?.now_playing?.duration) return;
      const serverNow = Date.now() / 1000 + serverClockOffsetRef.current;
      const startedAt = data.now_playing.played_at || serverNow;
      const duration = data.now_playing.duration;

      if (duration > 0) {
        const computedElapsed = Math.max(0, Math.min(duration, Math.floor(serverNow - startedAt)));
        setLocalElapsed(computedElapsed);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data?.now_playing?.duration, data?.now_playing?.played_at]);

  return {
    data,
    localElapsed,
    isOnline,
    isLoading,
    refresh: fetchNowPlaying,
  };
}
