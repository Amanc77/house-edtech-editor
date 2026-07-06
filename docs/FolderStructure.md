# Folder Structure

```
syncdocs/
├── app/                          # Next.js App Router
│   ├── api/                      # REST API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── documents/            # Document CRUD & sharing
│   │   ├── sync/                 # Offline sync engine API
│   │   ├── versions/             # Version history API
│   │   └── ai/                   # AI feature endpoints
│   ├── dashboard/                # Document list dashboard
│   ├── documents/                # Document editor pages
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── settings/                 # User settings
│   ├── layout.tsx                # Root layout + providers
│   ├── page.tsx                  # Landing page
│   ├── error.tsx                 # Error boundary
│   └── global-error.tsx          # Global error handler
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/                   # Header, Footer, Sidebar
│   └── features/                 # Feature-specific components
│       ├── auth/                 # Login, Register forms
│       ├── documents/            # Document cards, dialogs
│       ├── editor/               # TipTap editor suite
│       ├── sync/                 # Sync indicators
│       └── presence/             # Collaboration presence
├── server/
│   ├── controllers/              # Request validation + routing
│   ├── services/                 # Business logic
│   ├── repositories/             # MongoDB data access
│   ├── models/                   # Mongoose schemas
│   ├── middleware/               # Rate limit, auth, validation
│   ├── socket/                   # Socket.io server
│   ├── db/                       # MongoDB connection
│   └── index.ts                  # Custom server (Next + Socket.io)
├── offline/
│   ├── db.ts                     # Dexie IndexedDB schema
│   ├── sync-engine.ts            # Background sync queue
│   ├── merge-client.ts           # Client-side merge
│   └── network.ts                # Online/offline detection
├── hooks/                        # React hooks
├── stores/                       # Zustand state stores
├── providers/                    # React context providers
├── schemas/                      # Zod validation schemas
├── types/                        # TypeScript type definitions
├── lib/                          # Auth, merge engine, security
├── utils/                        # Helper utilities
├── constants/                    # App constants
├── tests/                        # Vitest unit tests
├── docs/                         # Documentation
└── scripts/                      # Dev utility scripts
```

## Layer Rules

| Layer | Responsibility | Can Access |
|-------|---------------|------------|
| API Route | HTTP entry point | Controller |
| Controller | Validate + respond | Service |
| Service | Business logic | Repository, other Services |
| Repository | Database queries | Mongoose Models |
| Component | UI rendering | Hooks, Stores |
| Hook | Client logic | Stores, Offline, API |
