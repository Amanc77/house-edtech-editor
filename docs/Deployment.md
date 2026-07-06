# Deployment Guide

## Vercel (Recommended for assignment)

### Step 1: MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free M0 cluster
2. **Database Access** → Add user with password
3. **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere)
4. **Connect** → Drivers → Copy connection string:
   ```
   mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/syncdocs?retryWrites=true&w=majority
   ```

### Step 2: GitHub

```bash
git add .
git commit -m "feat: complete SyncDocs local-first collaborative editor"
git remote add origin https://github.com/YOUR_USERNAME/syncdocs.git
git push -u origin main
```

### Step 3: Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add **Environment Variables**:

| Name | Value |
|------|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `AUTH_SECRET` | Run: `openssl rand -base64 32` |
| `AUTH_URL` | `https://YOUR-APP.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `SyncDocs` |
| `NEXT_PUBLIC_AUTHOR_NAME` | Your full name |
| `NEXT_PUBLIC_GITHUB_URL` | Your GitHub profile URL |
| `NEXT_PUBLIC_LINKEDIN_URL` | Your LinkedIn profile URL |
| `OPENAI_API_KEY` | (optional) For AI features |

4. Click **Deploy**

### Step 4: Post-deploy

- Update `AUTH_URL` and `NEXT_PUBLIC_APP_URL` with actual Vercel URL
- Redeploy if needed
- Test: Register → Create document → Edit offline → Sync

## Full Real-time (Socket.io)

Vercel serverless does not support persistent WebSocket connections.

For full Socket.io (live cursors, presence):

```bash
npm run dev    # local custom server
# OR deploy to Railway/Render with:
npm run start
```

HTTP sync works on Vercel without Socket.io.

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs lint, type-check, tests, and build on every push.
