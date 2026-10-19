import { Router } from 'express';
import { all, get, run, fromRow, tables } from '../db.js';
import { validate } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { profileSchema } from '../schemas.js';

export const getProfile = async () => JSON.parse((await get('SELECT data FROM profile WHERE id = 1'))?.data || '{}');

export const profileRouter = Router();

profileRouter.get('/', async (_req, res) => res.json(await getProfile()));

profileRouter.put('/', requireAuth, validate(profileSchema), async (req, res) => {
  await run(
    'INSERT INTO profile (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data',
    JSON.stringify(req.body),
  );
  res.json(await getProfile());
});

/** Everything the public homepage needs, in one round trip. */
export const portfolioRouter = Router();

portfolioRouter.get('/', async (_req, res) => {
  const list = async (table, where = '') =>
    (await all(`SELECT * FROM ${table} ${where} ORDER BY ${tables[table].orderBy}`)).map((r) => fromRow(tables[table], r));

  const [profile, skills, experience, projects] = await Promise.all([
    getProfile(),
    list('skills'),
    list('experience'),
    list('projects', 'WHERE visible = 1'),
  ]);
  res.json({ profile, skills, experience, projects });
});
