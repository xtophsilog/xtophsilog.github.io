# Portfolio — React + Node.js

A personal portfolio with a built-in CMS. The front end is a **React (Vite)** single-page app. The back end is a **Node.js / Express** REST API with **SQLite** storage through the libSQL client: a local file in development, and a free hosted [Turso](https://turso.tech) database in production.

**Design:** a dark "terminal editorial" look with an acid-lime accent, a typewriter hero, segmented skill meters and a ⌘K / Ctrl+K command palette.

## Features

**Public site**
- Hero, about, skills (grouped, with level meters), experience timeline, projects (with technology filter) and a contact form
- Project detail pages (`/projects/:slug`) with a Markdown case study
- ⌘K command palette to jump to sections or projects, copy your email and open your social links
- Responsive, keyboard-accessible, and honours `prefers-reduced-motion`

**Admin dashboard** (`/admin`)
- JWT login (bcrypt-hashed password, rate-limited)
- Dashboard: KPIs, a 14-day page-view chart, top pages, recent messages and projects by status
- **Projects:** create, edit and delete projects; Markdown editor with live preview; image upload; inline status, featured and visibility toggles; search and status filter
- **Skills:** inline-editable table with level sliders
- **Experience:** roles with dates and highlight bullets
- **Messages:** inbox with search, read/unread filter, mark read, reply by email and delete. The sidebar shows an unread badge.
- **Profile:** name, headline, bio, avatar, résumé link, hero stats, social links and an availability toggle
- **Settings:** change your password

**API / backend**
- Express 5 with Helmet, CORS and zod validation on every write
- A generic CRUD router factory, shared by projects, skills and experience
- Contact form protection: rate limit (5 per hour per IP), honeypot field and server-side validation
- Optional email notifications via SMTP (nodemailer). Messages are always stored in the database.
- Image uploads with multer (JPG, PNG, WebP or GIF, up to 5 MB), stored in the database
- Privacy-friendly page-view tracking: only the path is recorded, and admin pages are excluded
- In production, the API serves the built React app from a single origin

## Getting started

Requires **Node.js 22.13+**; Node 24 is recommended.

```bash
npm run install:all
cp server/.env.example server/.env   # then edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev
```

- Site: http://localhost:5173
- Admin: http://localhost:5173/admin. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env`. The defaults are in `.env.example`, so change the password from **Settings** after your first login.
- API: http://localhost:5000/api

On first start, the server creates the database, the admin user and starter content. Edit everything from the dashboard. To reset the content to the starter data, run `npm run seed`.

### Production

```bash
npm run build                      # builds client/dist
NODE_ENV=production npm start      # API + static site on PORT (default 5000)
```

## Deployment (free)

The whole app runs as **one Render web service**. The Node server serves both the API and the built React site, so you don't need CORS settings or a separate frontend host. Your data is stored in a free **Turso** database. Render's free disk is erased on every restart and deploy, so the database can't be a local file there. Uploaded images are stored in the database for the same reason.

| What | Service | Free tier |
|---|---|---|
| Website + API | [Render](https://render.com) web service | Sleeps after 15 minutes without visits. The first visit after that takes about 30–60 seconds. |
| Database | [Turso](https://turso.tech) (hosted SQLite / libSQL) | Several GB of storage, no expiry |

### 1. Push the code to GitHub

```bash
git add -A
git commit -m "Prepare for deployment"
git push -u origin feature/portfolio
```

Then merge the branch into `main` on GitHub, or deploy from `feature/portfolio` directly.

### 2. Create the database on Turso

1. Sign up at https://app.turso.tech (GitHub login works).
2. Click **Create Database**, name it (for example `portfolio`) and pick the region closest to your Render region.
3. Open the database and copy its **URL** (`libsql://portfolio-<you>.turso.io`).
4. Click **Create Token** (read & write) and copy the token.

### 3. Deploy on Render

1. Sign up at https://render.com with GitHub.
2. Go to **New → Blueprint**, pick this repository and branch. Render reads [`render.yaml`](render.yaml).
3. Fill in the values it asks for:
   - `DATABASE_URL`: the Turso URL
   - `DATABASE_AUTH_TOKEN`: the Turso token
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD`: your admin login, used only when the database has no user yet
   - `JWT_SECRET` is generated for you.
4. Click **Apply**. The first build takes a few minutes. Your site is then live at `https://portfolio-xxxx.onrender.com`, and the dashboard at `/admin`.

On first start, the server creates the tables, the admin user and the starter content in Turso.

### 4. (Optional) Copy your local content to Turso

If you have already edited content locally, copy your local database up. This **replaces** everything in Turso, including the admin user, so you log in with your local password afterwards. In PowerShell, from the project root:

```powershell
$env:DATABASE_URL="libsql://portfolio-<you>.turso.io"; $env:DATABASE_AUTH_TOKEN="<token>"; npm run db:copy
```

Then close that terminal, so your local dev server keeps using the local file.

### Optional extras

- **Email notifications:** add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `MAIL_TO` in Render → *Environment*. A Gmail account with an app password works (`smtp.gmail.com`, port 587).
- **Avoid the cold start:** a free monitor such as [UptimeRobot](https://uptimerobot.com) can request `https://<your-site>.onrender.com/api/health` every 10 minutes. This keeps the free instance awake, which uses up its monthly free hours.
- **Custom domain:** Render → *Settings → Custom Domains* (free, HTTPS included).
- **Redeploys:** every push to the deployed branch redeploys automatically.

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | – | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | ✓ | Current user |
| PUT | `/api/auth/password` | ✓ | Change password |
| GET | `/api/portfolio` | – | Profile, skills, experience and visible projects in one call |
| GET/PUT | `/api/profile` | PUT ✓ | Read or update the profile |
| GET | `/api/projects` | – | Visible projects (all projects when authenticated) |
| GET | `/api/projects/slug/:slug` | – | A single project |
| POST/PUT/PATCH/DELETE | `/api/projects[/:id]` | ✓ | Manage projects |
| … | `/api/skills`, `/api/experience` | writes ✓ | Same CRUD shape |
| POST | `/api/contact` | – | Submit the contact form |
| GET/PATCH/DELETE | `/api/messages[/:id]` | ✓ | Inbox (`?filter=unread\|read&q=`) |
| POST | `/api/track` | – | Record a page view |
| GET | `/api/stats` | ✓ | Dashboard statistics |
| POST | `/api/uploads` | ✓ | `multipart/form-data` with field `file` |

## Project structure

```
react-node/
├── client/                 React + Vite
│   └── src/
│       ├── components/     Sections, nav, command palette, Markdown
│       ├── pages/          Home, project detail, 404
│       ├── admin/          Lazy-loaded dashboard pages
│       └── styles/
└── server/                 Express API
    └── src/
        ├── db.js           Schema + row mapping (libSQL)
        ├── schemas.js      zod validation
        ├── routes/         auth, crud factory, resources, messages, analytics, uploads
        ├── seed.js         Admin user + starter content
        └── copy-to-remote.js  Copies the local database to Turso (npm run db:copy)
```
