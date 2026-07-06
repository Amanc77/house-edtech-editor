# SyncDocs

**Local-first collaborative document editor** with offline synchronization, deterministic conflict resolution, version history, real-time collaboration, and AI features.

Built for the [House of Edtech](https://houseofedtech.in) Full Stack Developer assignment.

## Live Demo

> Deploy to Vercel and add your URL here after deployment.

## Features

- **Local-first architecture** — IndexedDB (Dexie) as source of truth; zero network blocking
- **Background sync engine** — Operation queue, retry with exponential backoff, batch upload
- **Deterministic conflict resolution** — Lamport clocks + vector clocks, no data loss
- **Version history** — Snapshots, compare, restore (creates new version, never destroys history)
- **Real-time collaboration** — Socket.io presence, cursors, typing indicators
- **Rich text editor** — TipTap with tables, code blocks, slash commands, emoji
- **AI assistant** — Summarize, improve, grammar, translate, continue writing (OpenAI/Gemini)
- **Auth & RBAC** — Auth.js JWT, Owner / Editor / Viewer roles
- **Security** — Rate limiting, Zod validation, payload size limits, input sanitization

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, React 19, TypeScript |
| Database | MongoDB, Mongoose |
| Auth | Auth.js (NextAuth v5), JWT |
| Offline | Dexie (IndexedDB) |
| Real-time | Socket.io |
| State | Zustand |
| UI | Tailwind CSS, shadcn/ui, Radix UI |
| AI | AI SDK (OpenAI, Gemini) |
| Testing | Vitest, Playwright |

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd house-edtech-editor
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | Random 32+ char secret (`openssl rand -base64 32`) |
| `AUTH_URL` | App URL (`http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Same as AUTH_URL for client |

**Optional:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`

**Footer (submission):** Set `NEXT_PUBLIC_AUTHOR_NAME`, `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_LINKEDIN_URL`

### 3. Run locally

**Option A — Next.js only (Vercel-compatible, HTTP sync):**

```bash
npm run dev:next
```

**Option B — Full stack with Socket.io (custom server):**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Scripts

```bash
npm run dev          # Next.js (3000) + Socket.io (3001)
npm run dev:server   # Custom server + Socket.io on 3000 (production-like)
npm run dev:next     # Next.js dev only
npm run build        # Production build
npm run start        # Production custom server
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E
```

## Deploy to Vercel (Live)

1. Push code to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables (same as `.env.local`)
4. Deploy

> **Note:** Vercel runs serverless functions — Socket.io real-time requires the custom server (`npm run dev` / deploy to Railway/Render). Offline sync and all API features work on Vercel via HTTP.

### MongoDB Atlas setup

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Database Access → create user
3. Network Access → allow `0.0.0.0/0` (or Vercel IPs)
4. Connect → copy connection string → set as `MONGODB_URI`

## Project Structure

```
app/           # Next.js pages & API routes
components/    # UI components (shadcn, features, layout)
features/      # Feature modules
server/        # Controllers → Services → Repositories → MongoDB
offline/       # Dexie DB, sync engine, merge client
stores/        # Zustand stores
hooks/         # React hooks
providers/     # Context providers
schemas/       # Zod validation
types/         # TypeScript types
lib/           # Auth, merge engine, security utils
tests/         # Vitest & Playwright tests
docs/          # Architecture documentation
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Login (JWT session) |
| `/api/documents` | GET/POST | List / create documents |
| `/api/documents/[id]` | GET/PATCH/DELETE | Document CRUD |
| `/api/sync` | POST | Push offline operations |
| `/api/versions/[id]` | GET/POST | Version history |
| `/api/ai` | POST | AI features |

See [docs/API.md](docs/API.md) for full reference.

## Author

Update footer env vars with your name and profiles before submission.

## License

MIT
