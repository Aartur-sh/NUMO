import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// NUMO Radio Server Base
const NUMO_BASE = 'https://numo.pp.ua';

// In-memory cache for now-playing
let nowPlayingCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 3000; // 3 seconds cache

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Proxy endpoint for nowplaying JSON
app.get('/api/radio/nowplaying', async (_req, res) => {
  const now = Date.now();
  if (nowPlayingCache && now - nowPlayingCache.timestamp < CACHE_TTL_MS) {
    return res.json(nowPlayingCache.data);
  }

  try {
    const response = await fetch(`${NUMO_BASE}/hls/nowplaying.json?_=${now}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NumoRadioApp/1.0',
        'Cache-Control': 'no-store',
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    nowPlayingCache = { data, timestamp: now };
    return res.json(data);
  } catch (error: any) {
    console.error('Error fetching nowplaying:', error?.message);
    if (nowPlayingCache) {
      return res.json(nowPlayingCache.data);
    }
    return res.status(502).json({ error: 'Now playing unavailable' });
  }
});

// Wildcard proxy route for HLS playlists and segments (/api/radio/hls/* -> https://numo.pp.ua/hls/*)
// Express 4 & Express 5 compatible parameter extraction with path validation and status forwarding
app.get(['/api/radio/hls/*', '/api/radio/hls/*splat'], (req, res) => {
  const rawParam = (req.params as any)[0] || (req.params as any).splat || (req.params as any)['*'];
  const fileSubPath = Array.isArray(rawParam) ? rawParam.join('/') : (rawParam || 'live.m3u8');

  // Security check: strictly allow valid filename extensions and reject path traversal (e.g. ..)
  if (!/^[\w.-]+\.(m3u8|mp3|aac|ts)$/i.test(fileSubPath)) {
    return res.status(400).send('Bad path');
  }

  const targetUrl = `${NUMO_BASE}/hls/${fileSubPath}`;

  req.socket.setTimeout(0);
  res.socket?.setTimeout(0);

  const streamReq = https.get(targetUrl, (streamRes) => {
    res.status(streamRes.statusCode || 502);

    const contentType = streamRes.headers['content-type'] ||
      (fileSubPath.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : fileSubPath.endsWith('.ts')
        ? 'video/mp2t'
        : 'application/octet-stream');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    streamRes.pipe(res);
  });

  streamReq.on('error', (err) => {
    console.error('HLS proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).send('Error connecting to HLS stream');
    }
  });

  req.on('close', () => {
    streamReq.destroy();
  });
});

// Proxy endpoint for continuous Icecast MP3 audio stream
app.get('/api/radio/stream', (req, res) => {
  const streamUrl = `${NUMO_BASE}/icecast/stream`;

  req.socket.setTimeout(0);
  res.socket?.setTimeout(0);

  const streamReq = https.get(streamUrl, (streamRes) => {
    res.status(streamRes.statusCode || 502);
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

// Proxy for album art image (strict Origin validation)
app.get('/api/radio/art', async (req, res) => {
  const artUrl = req.query.url as string;
  if (!artUrl || typeof artUrl !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  // Security check: validate exact origin to prevent bypasses like numo.pp.ua.evil.com
  try {
    const parsedUrl = new URL(artUrl);
    if (parsedUrl.origin !== new URL(NUMO_BASE).origin) {
      return res.status(403).send('Forbidden art source');
    }
  } catch {
    return res.status(400).send('Invalid url parameter');
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
