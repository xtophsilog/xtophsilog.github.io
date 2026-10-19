import fs from 'node:fs';
import crypto from 'node:crypto';
import express, { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { get, run } from '../db.js';
import { HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

// Images are stored in the database, so they survive restarts on hosts with a temporary disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new HttpError(400, 'Only JPG, PNG, WebP or GIF images are allowed')),
});

export const uploadsRouter = Router();

uploadsRouter.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'No file uploaded (field name: "file")');
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[req.file.mimetype]}`;
  await run('INSERT INTO uploads (name, mime, data) VALUES (?, ?, ?)', name, req.file.mimetype, req.file.buffer);
  res.status(201).json({ url: `/uploads/${name}` });
});

/** Serves uploaded images at /uploads/:name. */
export const uploadedFileRouter = Router();

uploadedFileRouter.get('/:name', async (req, res, next) => {
  const file = await get('SELECT mime, data FROM uploads WHERE name = ?', req.params.name);
  if (!file) return next();
  res.set({ 'Content-Type': file.mime, 'Cache-Control': 'public, max-age=604800, immutable' });
  res.send(Buffer.from(file.data));
});

// Images uploaded before they were stored in the database.
if (fs.existsSync(config.uploadsDir)) {
  uploadedFileRouter.use(express.static(config.uploadsDir, { maxAge: '7d' }));
}
