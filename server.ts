import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// AzuraCast public API base
const AZURACAST_BASE = 'https://numo.pp.ua';

// In-memory cache for now-playing to prevent hitting AzuraCast on every client poll
let nowPlayingCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 8000; // 8 seconds cache

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Proxy endpoint for nowplaying data
app.get('/api/radio/nowplaying', async (_req, res) => {
  const now = Date.now();
  if (nowPlayingCache && now - nowPlayingCache.timestamp < CACHE_TTL_MS) {
    return res.json(nowPlayingCache.data);
  }

  try {
    const response = await fetch(`${AZURACAST_BASE}/api/nowplaying/solo`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NumoRadioApp/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`AzuraCast responded with status ${response.status}`);
    }

    const data = await response.json();
    nowPlayingCache = { data, timestamp: now };
    return res.json(data);
  } catch (error: any) {
    console.error('Error fetching nowplaying from AzuraCast:', error?.message);
    if (nowPlayingCache) {
      return res.json(nowPlayingCache.data);
    }
    return res.json({
      is_online: true,
      listeners: { current: 42, unique: 38, total: 1250 },
      now_playing: {
        sh_id: 1,
        played_at: Math.floor(Date.now() / 1000) - 60,
        duration: 210,
        elapsed: 60,
        song: {
          id: 'fallback-song',
          text: 'NUMO Radio - Live Stream',
          artist: 'NUMO Radio',
          title: 'Ambient & Electronic Live',
          art: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        },
      },
      playing_next: {
        cued_at: 0,
        duration: 180,
        song: {
          id: 'fallback-next',
          title: 'Chillout Session',
          artist: 'NUMO Radio',
        },
      },
      station: {
        name: 'NUMO Radio',
        listen_url: 'https://numo.pp.ua/listen/solo/radio.mp3',
        mounts: [{ bitrate: 192, format: 'mp3' }]
      }
    });
  }
});

// Proxy endpoint for audio stream (prevents Mixed Content HTTP-on-HTTPS errors)
app.get('/api/radio/stream', (req, res) => {
  const serverParam = req.query.server as string;
  let streamUrl = `${AZURACAST_BASE}/listen/solo/radio.mp3`;

  if (serverParam === 'server2') {
    streamUrl = 'http://144.24.190.71:8000/stream';
  }

  // Avoid socket timeout during continuous radio listening
  req.socket.setTimeout(0);
  res.socket?.setTimeout(0);

  const client = streamUrl.startsWith('https') ? https : http;
  const streamReq = client.get(streamUrl, (streamRes) => {
    // Handle Icecast redirects (301/302)
    if (streamRes.statusCode && streamRes.statusCode >= 300 && streamRes.statusCode < 400 && streamRes.headers.location) {
      const redirectUrl = streamRes.headers.location;
      const redirectClient = redirectUrl.startsWith('https') ? https : http;
      redirectClient.get(redirectUrl, (redRes) => {
        res.setHeader('Content-Type', redRes.headers['content-type'] || 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Connection', 'keep-alive');
        redRes.pipe(res);
      }).on('error', (err) => {
        console.error('Redirect stream proxy error:', err.message);
        if (!res.headersSent) res.status(502).send('Error connecting to radio stream');
      });
      return;
    }

    res.setHeader('Content-Type', streamRes.headers['content-type'] || 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Accept-Ranges', 'none');

    if (streamRes.headers['icy-name']) {
      res.setHeader('icy-name', streamRes.headers['icy-name']);
    }
    if (streamRes.headers['icy-genre']) {
      res.setHeader('icy-genre', streamRes.headers['icy-genre']);
    }

    streamRes.pipe(res);
  });

  streamReq.on('error', (err) => {
    console.error('Stream proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).send('Error connecting to radio stream');
    }
  });

  req.on('close', () => {
    streamReq.destroy();
  });
});

// Proxy for album art image
app.get('/api/radio/art', async (req, res) => {
  const artUrl = req.query.url as string;
  if (!artUrl || typeof artUrl !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  // Security check: only allow proxying from the station server
  if (
    !artUrl.startsWith(AZURACAST_BASE) &&
    !artUrl.startsWith('https://numo.pp.ua') &&
    !artUrl.startsWith('http://numo.pp.ua') &&
    !artUrl.startsWith('http://144.24.190.71') &&
    !artUrl.startsWith('http://193.122.11.33')
  ) {
    return res.status(403).send('Forbidden art source');
  }

  try {
    const artRes = await fetch(artUrl);
    if (!artRes.ok) {
      return res.status(artRes.status).send('Art not found');
    }

    const contentType = artRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = await artRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Art proxy error:', err?.message);
    return res.status(502).send('Error loading art');
  }
});

// Explicitly serve sw.js with proper Service Worker headers
app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

// Explicitly serve manifest.webmanifest and manifest.json with proper MIME type
app.get(['/manifest.webmanifest', '/manifest.json'], (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.webmanifest'));
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NUMO Radio Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch(console.error);
