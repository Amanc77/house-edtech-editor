# SyncDocs

**Local-first collaborative document editor** — offline sync, conflict resolution, version history, and AI-assisted writing.

Built for the [House of Edtech](https://houseofedtech.in) Full Stack Developer Assignment (v2.1).

## Live Demo

**[https://house-edtech-editor.vercel.app](https://house-edtech-editor.vercel.app)**

## What It Does

SyncDocs is a Google Docs–style editor that works **without internet**. Edits save instantly to IndexedDB, sync in the background when online, and merge deterministically using Lamport + vector clocks — no data loss.

| Capability | Implementation |
|------------|----------------|
| Local-first editing | Dexie (IndexedDB) as primary store |
| Background sync | Queued operations, retry with backoff |
| Conflict resolution | Lamport clocks + vector clocks |
| Version history | Snapshots, compare, safe restore |
| Auth & RBAC | Auth.js JWT — Owner / Editor / Viewer |
| AI features | AI SDK (OpenAI / Gemini) |
| Real-time (optional) | Socket.io on custom Node server |

## Tech Stack

Next.js 16 · React 19 · TypeScript · MongoDB · Auth.js · Dexie · Socket.io · Zustand · TipTap · Tailwind · shadcn/ui · Vitest · Playwright

## Quick Start

```bash
git clone <your-repo>
cd house-edtech-editor
npm install
cp .env.example .env.local   # fill in MongoDB + AUTH_SECRET
npm run dev                  # http://localhost:3000
```

**Requirements:** Node 20+, MongoDB ([Atlas](https://www.mongodb.com/atlas) free tier works).

## Deploy on Vercel

1. Push to GitHub and import at [vercel.com/new](https://vercel.com/new)
2. Set environment variables:

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://...` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SOCKET_ENABLED` | `false` |
| `NEXT_PUBLIC_AUTHOR_NAME` | Your name |
| `NEXT_PUBLIC_GITHUB_URL` | Your GitHub |
| `NEXT_PUBLIC_LINKEDIN_URL` | Your LinkedIn |

3. Deploy

> **Note:** Vercel runs serverless — real-time WebSockets need a custom server (Railway/Render). On Vercel, offline sync and all HTTP APIs work fully; Socket.io is disabled automatically.

## Scripts

```bash
npm run dev          # Next.js + Socket.io (local)
npm run build        # Production build
npm run start        # Custom server (production)
npm run test         # Unit tests
npm run test:e2e     # E2E tests
```

## Architecture

```
Client (IndexedDB) ──sync queue──▶ POST /api/sync ──▶ MongoDB
                                 ◀── merged state ──┘
```

- **Offline:** All reads/writes hit IndexedDB — zero UI blocking
- **Online:** Background engine pushes operations, fetches remote changes
- **Security:** Zod validation, rate limiting, payload size caps, HTML sanitization

See [docs/API.md](docs/API.md) for API reference.

## Author

Configure footer via env: `NEXT_PUBLIC_AUTHOR_NAME`, `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_LINKEDIN_URL`.

## License

MIT
