// Copies everything from your local SQLite file to the hosted database in DATABASE_URL,
// replacing what is there. Run with: npm run db:copy (see README → Deployment).
import path from 'node:path';
import { createClient } from '@libsql/client';
import { config } from './config.js';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  console.error('Set DATABASE_URL (and DATABASE_AUTH_TOKEN) to your hosted database first.');
  process.exit(1);
}

// Importing db.js connects to DATABASE_URL and creates any missing tables there.
const { db: remote } = await import('./db.js');
const localFile = path.resolve(config.root, process.env.DB_FILE || 'data/portfolio.db').replaceAll('\\', '/');
const local = createClient({ url: `file:${localFile}` });

const TABLES = ['users', 'profile', 'projects', 'skills', 'experience', 'messages', 'page_views', 'uploads'];
const existing = new Set(
  (await local.execute("SELECT name FROM sqlite_master WHERE type = 'table'")).rows.map((r) => r.name),
);

const statements = [];
for (const table of TABLES) {
  statements.push(`DELETE FROM ${table}`);
  if (!existing.has(table)) continue;
  const { rows, columns } = await local.execute(`SELECT * FROM ${table}`);
  for (const row of rows) {
    statements.push({
      sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      args: columns.map((c) => row[c]),
    });
  }
  console.log(`${table}: ${rows.length} rows`);
}

await remote.batch(statements, 'write');
console.log(`Copied ${localFile} to ${process.env.DATABASE_URL}`);
