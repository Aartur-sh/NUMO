import { useEffect, useState, useRef } from 'react';
import type { NowPlayingResponse } from '../types';

export function useNowPlaying() {
  const [data, setData] = useState<NowPlayingResponse | null>(null);
  const [localElapsed, setLocalElapsed] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const lastSyncTimeRef = useRef<number>(Date.now());
  const initialElapsedRef = useRef<number>(0);
  const currentSongIdRef = useRef<string | null>(null);

  const fetchNowPlaying = async () => {
    try {
      let res: Response;
      try {
        res = await fetch('https://numo.pp.ua/api/nowplaying/solo');
        if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
      } catch {
        res = await fetch('/api/radio/nowplaying');
        if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
      }
      const json: NowPlayingResponse = await res.json();
      
      const newSongId = json.now_playing?.song?.id || json.now_playing?.song?.title || null;
      const serverElapsed = json.now_playing?.elapsed || 0;
      const now = Date.now();

      // If song changed, snap immediately
      if (newSongId !== currentSongIdRef.current) {
        currentSongIdRef.current = newSongId;
        initialElapsedRef.current = serverElapsed;
        lastSyncTimeRef.current = now;
        setLocalElapsed(serverElapsed);
      } else {
        // Same song: Check drift between local calculated elapsed and server elapsed
        const secondsPassed = Math.floor((now - lastSyncTimeRef.current) / 1000);
        const expectedElapsed = initialElapsedRef.current + secondsPassed;
        const drift = Math.abs(serverElapsed - expectedElapsed);

        // If drift is significant (> 3 seconds), resнк. Otherwise, keep smooth local increment to avoid jumping!
        if (drift > 3) {
          initialElapsedRef.current = serverElapsed;
          lastSyncTimeRef.current = now;
          setLocalElapsed(serverElapsed);
        }
      }

      setData(json);
      setIsOnline(json.is_online ?? true);
      setIsLoading(false);
    } catch (err) {
      console.warn('Failed to fetch nowplaying data:', err);
      setIsOnline(false);
      setIsLoading(false);
    }
  };

  // Initial fetch and interval poll
  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, []);

  // Smooth 1-second elapsed counter increment
  useEffect(() => {
    const timer = setInterval(() => {
      if (!data?.now_playing?.duration) return;
      const secondsPassedSinceSync = Math.floor((Date.now() - lastSyncTimeRef.current) / 1000);
      const computedElapsed = initialElapsedRef.current + secondsPassedSinceSync;

      if (computedElapsed <= data.now_playing.duration) {
        setLocalElapsed(computedElapsed);
      } else {
        // Track finished or near end, trigger quick refresh
        fetchNowPlaying();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data?.now_playing?.duration]);

  return {
    data,
    localElapsed,
    isOnline,
    isLoading,
    refresh: fetchNowPlaying,
  };
}
