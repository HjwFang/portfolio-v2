# portfolio-v2

Personal site for **horst fang** — SYDE @ UWaterloo.

Next.js App Router portfolio with a cream/brown visual system, interactive 3D hero, experience & project grids, art gallery, and a Spotify widget.

## Stack

- **Next.js 16** / React 19 / TypeScript / Tailwind CSS 4
- **Three.js** + React Three Fiber / Drei (hero models)
- **Upstash Redis** (Spotify cache; in-memory fallback in local dev)
- **Vitest** + ESLint (CI on `master`)
- **Vercel Analytics**

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # eslint
npm run test    # vitest
```

## Environment

Copy these into `.env` (or pull from Vercel). Spotify/Redis are optional for local UI work — the now-playing widget degrades without them.

| Variable | Purpose |
| :--- | :--- |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app secret |
| `SPOTIFY_REFRESH_TOKEN` | User refresh token for currently/recently played |
| `KV_REST_API_URL` | Upstash Redis REST URL (prod) |
| `KV_REST_API_TOKEN` | Upstash Redis REST token (prod) |
| `CRON_SECRET` | Bearer token for `GET /api/spotify/refresh` |

## Structure

```
app/            pages + API routes (Spotify)
components/     UI, hero, gallery, motion
lib/            portfolio content, Spotify cache, helpers
public/         images, art, 3D models, sounds
scripts/        art pipeline (clean / webp / sizes / exif)
design.md       color & type source of truth
```

Content for experience and projects lives in `lib/portfolioContent.ts`.

## Design

Warm cream background (`#fffeee`), dark brown type (`#502e2e`), General Sans + Quicksand. See [`design.md`](./design.md) for the full palette and type specs.
