import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { get, run } from '../db.js';
import { HttpError, validate } from '../lib/http.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { loginSchema, passwordSchema } from '../schemas.js';

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

authRouter.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const user = await get('SELECT * FROM users WHERE email = ?', req.body.email.toLowerCase());
  if (!user || !bcrypt.compareSync(req.body.password, user.password_hash)) {
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ token: signToken(user), user: { id: user.id, email: user.email } });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.put('/password', requireAuth, validate(passwordSchema), async (req, res) => {
  const user = await get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!user || !bcrypt.compareSync(req.body.currentPassword, user.password_hash)) {
    throw new HttpError(400, 'Current password is incorrect');
  }
  await run('UPDATE users SET password_hash = ? WHERE id = ?', bcrypt.hashSync(req.body.newPassword, 12), user.id);
  res.json({ ok: true });
});
