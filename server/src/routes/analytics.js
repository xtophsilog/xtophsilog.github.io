import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { all, get, run, toIso } from '../db.js';
import { mailEnabled } from '../lib/mailer.js';
import { requireAuth } from '../middleware/auth.js';

export const trackRouter = Router();

trackRouter.post('/', rateLimit({ windowMs: 60 * 1000, limit: 30 }), async (req, res) => {
  const path = typeof req.body?.path === 'string' ? req.body.path.slice(0, 200) : '/';
  if (!path.startsWith('/admin')) await run('INSERT INTO page_views (path) VALUES (?)', path);
  res.status(204).end();
});

export const statsRouter = Router();

statsRouter.get('/', requireAuth, async (_req, res) => {
  const count = async (sql) => (await get(sql)).n;

  const [rows, projects, projectsByStatus, skills, experience, messages, unread, totalViews, topPaths, recentMessages] =
    await Promise.all([
      all(
        `SELECT date(created_at) AS day, COUNT(*) AS views FROM page_views
         WHERE created_at >= datetime('now', '-13 days', 'start of day')
         GROUP BY day`,
      ),
      count('SELECT COUNT(*) AS n FROM projects'),
      all('SELECT status, COUNT(*) AS n FROM projects GROUP BY status'),
      count('SELECT COUNT(*) AS n FROM skills'),
      count('SELECT COUNT(*) AS n FROM experience'),
      count('SELECT COUNT(*) AS n FROM messages'),
      count('SELECT COUNT(*) AS n FROM messages WHERE is_read = 0'),
      count('SELECT COUNT(*) AS n FROM page_views'),
      all(
        `SELECT path, COUNT(*) AS views FROM page_views
         WHERE created_at >= datetime('now', '-30 days') GROUP BY path ORDER BY views DESC LIMIT 5`,
      ),
      all('SELECT id, name, subject, is_read AS isRead, created_at AS createdAt FROM messages ORDER BY id DESC LIMIT 5'),
    ]);

  // Fill gaps so the chart always shows 14 consecutive days.
  const byDay = Object.fromEntries(rows.map((r) => [r.day, r.views]));
  const views = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return { day: d, views: byDay[d] || 0 };
  });

  res.json({
    projects,
    projectsByStatus,
    skills,
    experience,
    messages,
    unread,
    totalViews,
    topPaths,
    views,
    recentMessages: recentMessages.map((m) => ({ ...m, isRead: Boolean(m.isRead), createdAt: toIso(m.createdAt) })),
    mailEnabled,
  });
});
