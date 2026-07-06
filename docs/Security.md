# Security

## Authentication

- **Auth.js v5** with JWT session strategy
- **bcrypt** password hashing (12 salt rounds)
- Session cookies: `authjs.session-token` (HttpOnly)
- Google OAuth optional provider

## Authorization

| Role | Permissions |
|------|------------|
| Owner | read, write, share, delete, restore, snapshot |
| Editor | read, write, snapshot |
| Viewer | read only (blocked from WebSocket writes) |

Enforced at:
- API middleware (`requireAuth`)
- Service layer (`permissionService`)
- Socket.io (`socketServer.ts` role check)

## Input Validation

All API inputs validated with **Zod** schemas in controllers.

Content sanitized via `sanitize-html` and `isomorphic-dompurify`.

## Rate Limiting

In-memory rate limiter per IP:
- Default: 100 requests / 60 seconds
- Configurable via `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`

## Payload Protection

| Limit | Value |
|-------|-------|
| Max sync payload | 1 MB (`MAX_SYNC_PAYLOAD_BYTES`) |
| Max title length | 200 chars |
| Max content length | 5 MB |
| Max operations per batch | 100 |
| Max operations per document | 50,000 |

Oversized payloads are rejected before processing to prevent OOM.

## Tenant Isolation

- MongoDB queries scoped by `userId` and document permissions
- Permission repository validates access before any document operation
- Users can only access documents they own or are shared with

## Middleware

Edge-safe cookie check for protected routes (no Node.js APIs in Edge runtime).

## Recommendations for Production

1. Use MongoDB Atlas with IP allowlist
2. Set strong `AUTH_SECRET` (32+ random bytes)
3. Enable HTTPS (automatic on Vercel)
4. Add Redis for distributed rate limiting
5. Enable MongoDB encryption at rest
6. Rotate API keys regularly
