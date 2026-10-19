import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { config } from './config.js';

// A remote Turso database in production (DATABASE_URL), or a local SQLite file in development.
if (config.dbUrl.startsWith('file:')) {
  fs.mkdirSync(path.dirname(config.dbUrl.slice('file:'.length)), { recursive: true });
}

export const db = createClient({ url: config.dbUrl, authToken: config.dbAuthToken });

/** Run one statement and return all rows. */
export const all = async (sql, ...args) => (await db.execute({ sql, args })).rows;

/** Run one statement and return the first row (or undefined). */
export const get = async (sql, ...args) => (await all(sql, ...args))[0];

/** Run one write statement; returns { changes, lastInsertRowid }. */
export async function run(sql, ...args) {
  const r = await db.execute({ sql, args });
  return { changes: r.rowsAffected, lastInsertRowid: r.lastInsertRowid };
}

await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profile (
    id   INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    summary     TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tech        TEXT NOT NULL DEFAULT '[]',
    image_url   TEXT,
    live_url    TEXT,
    repo_url    TEXT,
    status      TEXT NOT NULL DEFAULT 'completed',
    featured    INTEGER NOT NULL DEFAULT 0,
    visible     INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skills (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    category   TEXT NOT NULL DEFAULT 'General',
    level      INTEGER NOT NULL DEFAULT 50,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS experience (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    role        TEXT NOT NULL,
    company     TEXT NOT NULL,
    location    TEXT,
    start_date  TEXT NOT NULL,
    end_date    TEXT,
    description TEXT NOT NULL DEFAULT '',
    highlights  TEXT NOT NULL DEFAULT '[]',
    sort_order  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT,
    body       TEXT NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS page_views (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    path       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views (created_at);

  CREATE TABLE IF NOT EXISTS uploads (
    name       TEXT PRIMARY KEY,
    mime       TEXT NOT NULL,
    data       BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

/**
 * Table definitions: map API (camelCase) fields to columns, and declare which
 * columns hold JSON arrays or booleans so rows round-trip cleanly.
 */
export const tables = {
  projects: {
    columns: {
      title: 'title', slug: 'slug', summary: 'summary', description: 'description',
      tech: 'tech', imageUrl: 'image_url', liveUrl: 'live_url', repoUrl: 'repo_url',
      status: 'status', featured: 'featured', visible: 'visible', sortOrder: 'sort_order',
    },
    json: ['tech'],
    bool: ['featured', 'visible'],
    orderBy: 'sort_order ASC, created_at DESC',
    touch: true,
  },
  skills: {
    columns: { name: 'name', category: 'category', level: 'level', sortOrder: 'sort_order' },
    json: [],
    bool: [],
    orderBy: 'category ASC, sort_order ASC, name ASC',
  },
  experience: {
    columns: {
      role: 'role', company: 'company', location: 'location', startDate: 'start_date',
      endDate: 'end_date', description: 'description', highlights: 'highlights',
      sortOrder: 'sort_order',
    },
    json: ['highlights'],
    bool: [],
    orderBy: 'sort_order ASC, start_date DESC',
  },
};

// SQLite CURRENT_TIMESTAMP is UTC without a zone marker; expose ISO 8601 instead.
export const toIso = (ts) => (/^\d{4}-\d\d-\d\d \d/.test(ts) ? `${ts.replace(' ', 'T')}Z` : ts);

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export function fromRow(def, row) {
  if (!row) return null;
  const out = {};
  for (const [col, value] of Object.entries(row)) {
    const key = snakeToCamel(col);
    if (def?.json.includes(key)) out[key] = JSON.parse(value || '[]');
    else if (def?.bool.includes(key)) out[key] = Boolean(value);
    else if (key.endsWith('At') && typeof value === 'string') out[key] = toIso(value);
    else out[key] = value;
  }
  return out;
}

export function toRow(def, data) {
  const row = {};
  for (const [key, col] of Object.entries(def.columns)) {
    if (!(key in data)) continue;
    let value = data[key];
    if (def.json.includes(key)) value = JSON.stringify(value ?? []);
    else if (def.bool.includes(key)) value = value ? 1 : 0;
    else if (value === undefined) value = null;
    row[col] = value;
  }
  return row;
}

/** Run several write statements atomically. */
export const batch = (statements) => db.batch(statements, 'write');
