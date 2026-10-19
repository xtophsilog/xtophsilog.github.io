import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler } from './lib/http.js';
import { seed } from './seed.js';
import { authRouter } from './routes/auth.js';
import { portfolioRouter, profileRouter } from './routes/profile.js';
import { experienceRouter, projectsRouter, skillsRouter } from './routes/resources.js';
import { contactRouter, messagesRouter } from './routes/messages.js';
import { statsRouter, trackRouter } from './routes/analytics.js';
import { uploadedFileRouter, uploadsRouter } from './routes/uploads.js';

await seed();

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/profile', profileRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/experience', experienceRouter);
app.use('/api/contact', contactRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/track', trackRouter);
app.use('/api/stats', statsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.use('/uploads', uploadedFileRouter);

// In production, serve the built React app from the same origin.
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
  app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
}

app.use(errorHandler);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
