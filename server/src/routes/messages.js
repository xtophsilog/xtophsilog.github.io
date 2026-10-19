import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { all, get, run, fromRow } from '../db.js';
import { HttpError, parseId, validate } from '../lib/http.js';
import { notifyNewMessage } from '../lib/mailer.js';
import { requireAuth } from '../middleware/auth.js';
import { contactSchema } from '../schemas.js';

const msgDef = { json: [], bool: ['isRead'] };
const toMessage = (row) => fromRow(msgDef, row);

/** Public endpoint used by the contact form. */
export const contactRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' },
});

contactRouter.post('/', contactLimiter, validate(contactSchema), async (req, res) => {
  const { name, email, subject, body, website } = req.body;
  // Silently accept bot submissions so they don't retry.
  if (website) return res.status(201).json({ ok: true });

  const { lastInsertRowid } = await run(
    'INSERT INTO messages (name, email, subject, body) VALUES (?, ?, ?, ?)',
    name,
    email,
    subject || null,
    body,
  );
  notifyNewMessage({ name, email, subject, body });
  res.status(201).json({ ok: true, id: Number(lastInsertRowid) });
});

/** Admin inbox. */
export const messagesRouter = Router();
messagesRouter.use(requireAuth);

messagesRouter.get('/', async (req, res) => {
  const filter = req.query.filter;
  const where = filter === 'unread' ? 'WHERE is_read = 0' : filter === 'read' ? 'WHERE is_read = 1' : '';
  const q = typeof req.query.q === 'string' && req.query.q.trim() ? `%${req.query.q.trim()}%` : null;
  const search = q ? `${where ? 'AND' : 'WHERE'} (name LIKE ? OR email LIKE ? OR subject LIKE ? OR body LIKE ?)` : '';
  const rows = await all(
    `SELECT * FROM messages ${where} ${search} ORDER BY created_at DESC, id DESC`,
    ...(q ? [q, q, q, q] : []),
  );
  res.json(rows.map(toMessage));
});

messagesRouter.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const { changes } = await run('UPDATE messages SET is_read = ? WHERE id = ?', req.body?.isRead ? 1 : 0, id);
  if (!changes) throw new HttpError(404, 'Message not found');
  res.json(toMessage(await get('SELECT * FROM messages WHERE id = ?', id)));
});

messagesRouter.delete('/:id', async (req, res) => {
  const { changes } = await run('DELETE FROM messages WHERE id = ?', parseId(req.params.id));
  if (!changes) throw new HttpError(404, 'Message not found');
  res.status(204).end();
});
