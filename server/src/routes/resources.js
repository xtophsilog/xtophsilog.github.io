import { Router } from 'express';
import { get, fromRow, tables } from '../db.js';
import { HttpError, slugify } from '../lib/http.js';
import { optionalAuth } from '../middleware/auth.js';
import { experienceSchema, projectSchema, skillSchema } from '../schemas.js';
import { crudRouter } from './crud.js';

const uniqueSlug = async (base, excludeId = 0) => {
  let slug = base || 'project';
  for (let n = 2; await get('SELECT 1 FROM projects WHERE slug = ? AND id != ?', slug, excludeId); n++) {
    slug = `${base}-${n}`;
  }
  return slug;
};

export const projectsRouter = Router();

projectsRouter.get('/slug/:slug', optionalAuth, async (req, res) => {
  const row = await get('SELECT * FROM projects WHERE slug = ?', req.params.slug);
  if (!row || (!row.visible && !req.user)) throw new HttpError(404, 'Project not found');
  res.json(fromRow(tables.projects, row));
});

projectsRouter.use(
  crudRouter('projects', projectSchema, {
    publicWhere: 'visible = 1',
    beforeSave: async (data, id) => {
      if (data.slug !== undefined || data.title !== undefined) {
        if (!data.slug && data.title) data.slug = await uniqueSlug(slugify(data.title), id);
        else if (data.slug) data.slug = await uniqueSlug(data.slug, id);
      }
      return data;
    },
  }),
);

export const skillsRouter = crudRouter('skills', skillSchema);
export const experienceRouter = crudRouter('experience', experienceSchema);
