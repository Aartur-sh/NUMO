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

export interface PlayingNext {
  cued_at: number;
  played_at: number;
  duration: number;
  playlist: string;
  is_request: boolean;
  song: Song;
}

export interface SongHistoryItem {
  sh_id: number;
  played_at: number;
  duration: number;
  playlist: string;
  streamer: string;
  is_request: boolean;
  song: Song;
}

export interface Listeners {
  total: number;
  unique: number;
  current: number;
}

export interface Mount {
  id: number;
  name: string;
  url: string;
  bitrate: number;
  format: string;
  listeners: Listeners;
  path: string;
  is_default: boolean;
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
  public_player_url: string;
  playlist_pls_url: string;
  playlist_m3u_url: string;
  is_public: boolean;
  mounts: Mount[];
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
  playing_next: PlayingNext | null;
  song_history: SongHistoryItem[];
  is_online: boolean;
}
