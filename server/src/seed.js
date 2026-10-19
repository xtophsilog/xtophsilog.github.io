import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { batch, get, tables, toRow } from './db.js';

// Starter content — edit it all from the admin dashboard.
const profile = {
  name: 'Christopher Lapig',
  title: 'Full-Stack Developer',
  tagline: 'I design and build fast, accessible web products — from the database to the last pixel.',
  bio: 'I am a full-stack developer who enjoys turning messy problems into simple, well-crafted software. I work across the stack with React, Node.js and TypeScript, and I care about clean APIs, thoughtful UX and code that is easy to change.\n\nWhen I am not shipping features, I am usually learning a new tool, contributing to side projects, or refining my craft one commit at a time.',
  location: 'Philippines · Remote',
  email: 'you@example.com',
  avatarUrl: '',
  resumeUrl: '',
  available: true,
  stats: [
    { label: 'Years building', value: '4+' },
    { label: 'Projects shipped', value: '20+' },
    { label: 'Cups of coffee', value: '∞' },
  ],
  socials: { github: 'https://github.com/', linkedin: 'https://www.linkedin.com/', twitter: '', website: '' },
};

const skills = [
  ['React', 'Frontend', 92], ['TypeScript', 'Frontend', 88], ['Next.js', 'Frontend', 85], ['CSS / Tailwind', 'Frontend', 90],
  ['Node.js', 'Backend', 90], ['Express', 'Backend', 88], ['NestJS', 'Backend', 80], ['REST & GraphQL', 'Backend', 84],
  ['PostgreSQL', 'Data', 80], ['SQLite', 'Data', 85], ['MongoDB', 'Data', 75],
  ['Git & GitHub', 'Tooling', 92], ['Docker', 'Tooling', 72], ['CI/CD', 'Tooling', 70],
].map(([name, category, level], i) => ({ name, category, level, sortOrder: i }));

const experience = [
  {
    role: 'Full-Stack Developer', company: 'Acme Digital', location: 'Remote',
    startDate: '2023-03', endDate: null,
    description: 'Build and maintain customer-facing web apps and internal tools.',
    highlights: [
      'Led the rebuild of the client dashboard in React, cutting load time by 45%.',
      'Designed a Node.js API layer serving 1M+ requests per day.',
      'Introduced automated testing and CI, reducing production bugs by a third.',
    ],
    sortOrder: 0,
  },
  {
    role: 'Frontend Developer', company: 'Pixel & Co.', location: 'Manila, PH',
    startDate: '2021-06', endDate: '2023-02',
    description: 'Shipped marketing sites and e-commerce storefronts for agency clients.',
    highlights: [
      'Delivered 15+ responsive sites with a shared component library.',
      'Improved Lighthouse accessibility scores to 95+ across projects.',
    ],
    sortOrder: 1,
  },
  {
    role: 'Web Development Intern', company: 'StartUp Labs', location: 'Manila, PH',
    startDate: '2020-09', endDate: '2021-05',
    description: 'Supported the product team on features and bug fixes.',
    highlights: ['Built an internal reporting tool with Express and Chart.js.'],
    sortOrder: 2,
  },
];

const projects = [
  {
    title: 'Portfolio CMS', slug: 'portfolio-cms',
    summary: 'This site — a React front end with a Node.js API, SQLite storage and a full admin dashboard.',
    description: '## Overview\nA personal portfolio that doubles as a small content management system.\n\n## Highlights\n- JWT-protected admin dashboard for projects, skills, experience and profile\n- Contact form with validation, spam protection, rate limiting and email notifications\n- Built-in page-view analytics with a 14-day chart\n- Image uploads for project covers',
    tech: ['React', 'Node.js', 'Express', 'SQLite', 'JWT'],
    status: 'completed', featured: true, visible: true, sortOrder: 0,
    repoUrl: 'https://github.com/', liveUrl: '',
  },
  {
    title: 'TaskFlow', slug: 'taskflow',
    summary: 'A real-time Kanban board with drag-and-drop, team workspaces and activity history.',
    description: '## Overview\nCollaborative task management for small teams.\n\n## Highlights\n- Optimistic UI updates with WebSocket sync\n- Role-based access control\n- Activity feed and notifications',
    tech: ['React', 'TypeScript', 'Socket.IO', 'PostgreSQL'],
    status: 'completed', featured: true, visible: true, sortOrder: 1,
  },
  {
    title: 'ShopLite', slug: 'shoplite',
    summary: 'A lightweight e-commerce storefront with cart, checkout and an order management back office.',
    description: '## Overview\nA headless storefront focused on speed.\n\n## Highlights\n- Server-rendered product pages\n- Stripe test-mode checkout\n- Inventory and order dashboard',
    tech: ['Next.js', 'NestJS', 'Prisma', 'Stripe'],
    status: 'in_progress', featured: true, visible: true, sortOrder: 2,
  },
  {
    title: 'WeatherNow', slug: 'weathernow',
    summary: 'A minimal weather app with location search, hourly forecasts and offline support.',
    description: '## Overview\nA progressive web app built to explore service workers and caching strategies.',
    tech: ['JavaScript', 'PWA', 'OpenWeather API'],
    status: 'completed', featured: false, visible: true, sortOrder: 3,
  },
];

const insertAll = (table, items) =>
  items.map((item) => {
    const row = toRow(tables[table], item);
    const cols = Object.keys(row);
    return {
      sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      args: Object.values(row),
    };
  });

/** Create the admin user and starter content if the database is empty. */
export async function seed({ force = false } = {}) {
  const statements = [];

  if (!(await get('SELECT 1 FROM users LIMIT 1'))) {
    statements.push({
      sql: 'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      args: [config.adminEmail.toLowerCase(), bcrypt.hashSync(config.adminPassword, 12)],
    });
    console.log(`Creating admin user ${config.adminEmail}`);
  }

  if (force) statements.push('DELETE FROM projects', 'DELETE FROM skills', 'DELETE FROM experience', 'DELETE FROM profile');

  if (force || !(await get('SELECT 1 FROM profile'))) {
    statements.push(
      { sql: 'INSERT INTO profile (id, data) VALUES (1, ?)', args: [JSON.stringify(profile)] },
      ...insertAll('skills', skills),
      ...insertAll('experience', experience),
      ...insertAll('projects', projects),
    );
    console.log('Seeding starter portfolio content');
  }

  if (statements.length) await batch(statements);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await seed({ force: process.argv.includes('--force') });
}
