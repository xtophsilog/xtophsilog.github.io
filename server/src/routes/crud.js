import { Router } from 'express';
import { z } from 'zod';
import { all, get, run, fromRow, toRow, tables } from '../db.js';
import { HttpError, parseId, validate } from '../lib/http.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

/**
 * Generic REST resource: list/get are public (optionally filtered for anonymous
 * visitors), create/update/delete require an admin token.
 */
export function crudRouter(table, schema, { publicWhere, beforeSave } = {}) {
  const def = tables[table];
  const router = Router();

  const findById = async (id) => fromRow(def, await get(`SELECT * FROM ${table} WHERE id = ?`, id));

  router.get('/', optionalAuth, async (req, res) => {
    const where = !req.user && publicWhere ? `WHERE ${publicWhere}` : '';
    const rows = await all(`SELECT * FROM ${table} ${where} ORDER BY ${def.orderBy}`);
    res.json(rows.map((r) => fromRow(def, r)));
  });

  router.get('/:id', optionalAuth, async (req, res) => {
    const item = await findById(parseId(req.params.id));
    if (!item) throw new HttpError(404, 'Not found');
    res.json(item);
  });

  router.post('/', requireAuth, validate(schema), async (req, res) => {
    const data = beforeSave ? await beforeSave(req.body) : req.body;
    const row = toRow(def, data);
    const cols = Object.keys(row);
    const { lastInsertRowid } = await run(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      ...Object.values(row),
    );
    res.status(201).json(await findById(Number(lastInsertRowid)));
  });

  // PUT replaces with defaults applied; PATCH updates only the fields sent.
  const update = (partial) => async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!(await findById(id))) return next(new HttpError(404, 'Not found'));
    const parsed = (partial ? schema.partial() : schema).safeParse(req.body ?? {});
    if (!parsed.success) return next(new HttpError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors));
    // .partial() still fills .default() values; keep only keys the client sent.
    const input = partial
      ? Object.fromEntries(Object.entries(parsed.data).filter(([k]) => k in req.body))
      : parsed.data;
    const data = beforeSave ? await beforeSave(input, id) : input;
    const row = toRow(def, data);
    if (def.touch) row.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const cols = Object.keys(row);
    if (cols.length) {
      await run(`UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, ...Object.values(row), id);
    }
    res.json(await findById(id));
  };

  router.put('/:id', requireAuth, update(false));
  router.patch('/:id', requireAuth, update(true));

  router.delete('/:id', requireAuth, async (req, res) => {
    const { changes } = await run(`DELETE FROM ${table} WHERE id = ?`, parseId(req.params.id));
    if (!changes) throw new HttpError(404, 'Not found');
    res.status(204).end();
  });

  return router;
}
