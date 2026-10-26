# Cloudflare Workers deployment

| Folder | What | Deploy |
|---|---|---|
| `backend/` | Hono + D1 API (same routes as the Django API, incl. `/analytics`) | see `backend/README.md` |
| `frontend/` | Static Next.js export served by Workers Static Assets | below |

`frontend/` is a copy of the top-level `frontend/` (the Django-backed Next.js app) with a static-export
`next.config.mjs` and a `wrangler.jsonc`. When you change the UI, change `frontend/` and copy the changed
files over (everything except `next.config.mjs`, `package.json`, `wrangler.jsonc`, `env.production.example`).

```bash
cd workers/frontend
cp env.production.example .env.production    # set NEXT_PUBLIC_API_BASE_URL to the API Worker URL
pnpm install
pnpm cf:deploy
```
