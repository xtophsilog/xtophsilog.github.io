import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  root,
  port: Number(process.env.PORT) || 5000,
  // Comma-separated list of origins allowed to call the API from another domain.
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim()).filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  dbUrl:
    process.env.DATABASE_URL ||
    `file:${path.resolve(root, process.env.DB_FILE || 'data/portfolio.db').replaceAll('\\', '/')}`,
  dbAuthToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  uploadsDir: path.resolve(root, 'uploads'),
  clientDist: path.resolve(root, '../client/dist'),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Portfolio <no-reply@example.com>',
    to: process.env.MAIL_TO,
  },
};

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be set in production');
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set: using a local SQLite file, which free hosts erase on every restart.');
  }
}
