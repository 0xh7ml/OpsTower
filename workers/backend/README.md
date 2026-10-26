# OpsTower API (Cloudflare Worker)

Hono + D1 port of the Django API. Same routes (with or without trailing slash):

| Method | Path | Auth |
|---|---|---|
| GET | `/` | no |
| POST | `/auth/signup` | no |
| POST | `/auth/token` (`username`=email, `password`) | no |
| POST | `/auth/token/refresh` | no |
| GET/POST | `/task` | Bearer |
| POST | `/task/reorder` (`{items:[{id,status,position}]}`) | Bearer |
| GET/PUT/DELETE | `/task/:id` | Bearer |
| GET | `/analytics?range=week\|month\|year\|all` | Bearer |

## Local

```bash
npm install
cp .dev.vars.example .dev.vars        # set JWT_SECRET
npm run db:migrate:local
npm run dev
```

## Deploy (free plan)

```bash
npx wrangler login
npx wrangler d1 create opstower-db     # put the printed id in wrangler.jsonc
npm run db:migrate:remote
npx wrangler secret put JWT_SECRET     # e.g. `openssl rand -hex 32`
npm run deploy
```

Notes: passwords use PBKDF2-SHA256 (100k iterations, the Workers maximum). Existing Django users
cannot be migrated (different hash format); users must sign up again.
