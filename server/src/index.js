import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auth } from './routes/auth.js';
import { loans } from './routes/loans.js';
import { errorHandler } from './lib/errors.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);   // needed for secure cookies behind a platform proxy

  app.use(cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
    credentials: true,         // without this the refresh cookie never travels
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());

  if (process.env.SLOW_MODE === '1') app.use((_q, _s, next) => setTimeout(next, 600));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 20 }), auth);
  app.use('/api/loans', loans);

  app.use((_req, res) => res.status(404).json({ error: { message: 'No such endpoint.' } }));
  app.use(errorHandler);
  return app;
}

/**
 * Deliberately small in-memory limiter rather than a dependency: enough to blunt
 * credential stuffing in a demo. A real deployment puts this in Redis or at the
 * edge, because in-memory state does not survive more than one instance.
 */
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = hits.get(key) ?? { count: 0, reset: now + windowMs };
    if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
    entry.count += 1;
    hits.set(key, entry);
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: { message: 'Too many attempts. Wait a minute and try again.' } });
    }
    next();
  };
}

const isEntrypoint = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isEntrypoint) {
  const port = Number(process.env.PORT || 4000);
  createApp().listen(port, () => console.log(`toolshed-auth-api on http://localhost:${port}`));
}
