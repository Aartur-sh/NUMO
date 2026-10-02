export interface RawNowPlayingJson {
  artist: string;
  title: string;
  album: string;
  duration: number;
  started_at: number;
  cover: string;
}

export interface Song {
  id: string;
  text: string;
  artist: string;
  title: string;
  album: string;
  genre: string;
  art: string;
  lyrics?: string;
}

export interface NowPlayingCurrent {
  sh_id: number;
  played_at: number;
  duration: number;
  playlist: string;
  streamer: string;
  is_request: boolean;
  song: Song;
  elapsed: number;
  remaining: number;
}

export interface SongHistoryItem {
  sh_id: number;
  played_at: number;
  duration: number;
  playlist?: string;
  streamer?: string;
  is_request?: boolean;
  song: Song;
}

export interface Listeners {
  total: number;
  unique: number;
  current: number;
}

export interface Station {
  id: number;
  name: string;
  shortcode: string;
  description: string;
  frontend: string;
  backend: string;
  timezone: string;
  listen_url: string;
  url: string;
}

export interface NowPlayingResponse {
  station: Station;
  listeners: Listeners;
  live: {
    is_live: boolean;
    streamer_name: string;
    broadcast_start: number | null;
    art: string | null;
  };
  now_playing: NowPlayingCurrent;
  playing_next: null;
  song_history: SongHistoryItem[];
  is_online: boolean;
}
