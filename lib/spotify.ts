import { Redis } from "@upstash/redis";

export type TrackPayload = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  url: string;
  playedAt?: string;
  progressMs?: number;
  /** False when Spotify still has this item but playback is paused. */
  isPlaying?: boolean;
};

export type SpotifyPayload = {
  nowPlaying: TrackPayload | null;
  recent: TrackPayload[];
};

export type StoredPayload = SpotifyPayload & {
  /** Epoch ms of the last successful refresh — drives the staleness check. */
  fetchedAt: number;
  /** Epoch ms of the last successful recently-played fetch. */
  recentFetchedAt?: number;
};

/**
 * How long a stored payload is considered fresh. This is the real rate limiter:
 * one Spotify refresh per interval no matter how many visitors are polling.
 */
export const REFRESH_INTERVAL_S = 10;
/**
 * recently-played is far more rate-limit sensitive than currently-playing.
 * Poll it sparingly; server-side promotion keeps the list correct in between.
 */
const RECENT_FETCH_TTL_MS = 10 * 60_000;
const RECENT_MAX = 8;

export const KEY_PAYLOAD = "spotify:payload";
export const KEY_TOKEN = "spotify:token";
export const KEY_LOCK = "spotify:lock";
/**
 * Separate buckets, deliberately. Spotify quotas these endpoints independently
 * — recently-played routinely returns 429 with a multi-hour Retry-After while
 * currently-playing keeps serving 200 on the same token. One shared cooldown
 * would freeze the live widget for hours over a stale-list problem.
 */
export const KEY_COOLDOWN_NOW = "spotify:cooldown:now";
export const KEY_COOLDOWN_RECENT = "spotify:cooldown:recent";

/* ------------------------------------------------------------------ store */

type Store = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  /** SET NX EX — true only for the caller that won the key. */
  setNx(key: string, ttlSeconds: number): Promise<boolean>;
  exists(key: string): Promise<boolean>;
};

function upstashStore(redis: Redis): Store {
  return {
    get: (key) => redis.get(key),
    set: async (key, value, ttlSeconds) => {
      await (ttlSeconds ? redis.set(key, value, { ex: ttlSeconds }) : redis.set(key, value));
    },
    setNx: async (key, ttlSeconds) =>
      (await redis.set(key, 1, { nx: true, ex: ttlSeconds })) === "OK",
    exists: async (key) => (await redis.exists(key)) > 0,
  };
}

/**
 * Dev-only stand-in so `next dev` works before `vercel env pull`. Per-process,
 * so it gives none of the cross-instance guarantees the real store exists for.
 */
function memoryStore(): Store {
  const g = globalThis as typeof globalThis & {
    __spotifyMemStore?: Map<string, { value: unknown; expiresAt: number }>;
  };
  const map = (g.__spotifyMemStore ??= new Map());
  const live = (key: string) => {
    const hit = map.get(key);
    if (!hit) return null;
    if (hit.expiresAt && hit.expiresAt < Date.now()) {
      map.delete(key);
      return null;
    }
    return hit;
  };
  return {
    get: async <T,>(key: string) => (live(key)?.value ?? null) as T | null,
    set: async (key, value, ttlSeconds) => {
      map.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
    },
    setNx: async (key, ttlSeconds) => {
      if (live(key)) return false;
      map.set(key, { value: 1, expiresAt: Date.now() + ttlSeconds * 1000 });
      return true;
    },
    exists: async (key) => live(key) != null,
  };
}

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    store = upstashStore(new Redis({ url, token }));
  } else {
    console.warn(
      "[spotify] KV_REST_API_URL/TOKEN missing — using per-process memory store. " +
        "Run `vercel env pull .env.local` to share one durable cache."
    );
    store = memoryStore();
  }
  return store;
}

/* ---------------------------------------------------------------- helpers */

type RawTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  external_urls: { spotify: string };
};

function shape(track: RawTrack, playedAt?: string): TrackPayload {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    albumArt: track.album.images[2]?.url ?? track.album.images[0]?.url,
    url: track.external_urls.spotify,
    playedAt,
  };
}

function withoutProgress(track: TrackPayload): TrackPayload {
  const { progressMs: _p, isPlaying: _i, ...rest } = track;
  return rest;
}

function prependRecent(track: TrackPayload, recent: TrackPayload[]): TrackPayload[] {
  const entry: TrackPayload = {
    ...withoutProgress(track),
    playedAt: track.playedAt ?? new Date().toISOString(),
  };
  return [entry, ...recent.filter((t) => t.id !== entry.id)].slice(0, RECENT_MAX);
}

function mergeRecent(preferred: TrackPayload[], fallback: TrackPayload[]): TrackPayload[] {
  const seen = new Set<string>();
  const out: TrackPayload[] = [];
  for (const t of [...preferred, ...fallback]) {
    if (!t?.id || seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(withoutProgress(t));
    if (out.length === RECENT_MAX) break;
  }
  return out;
}

/* ------------------------------------------------------------------ spotify */

/** Cached for ~55 min. Previously re-granted on every fetch, which is what
 *  tripped the rate limiter on accounts.spotify.com. */
async function getAccessToken(): Promise<string> {
  const s = getStore();
  const cached = await s.get<string>(KEY_TOKEN);
  if (cached) return cached;

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!,
    }),
    cache: "no-store",
  });

  if (res.status === 429) {
    // Auth-level ban blocks everything, so cool down both buckets.
    await Promise.all([
      noteCooldown(KEY_COOLDOWN_NOW, res),
      noteCooldown(KEY_COOLDOWN_RECENT, res),
    ]);
    throw new Error("spotify token 429");
  }
  if (!res.ok) throw new Error(`spotify token ${res.status}`);

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("spotify token missing");

  await s.set(KEY_TOKEN, data.access_token, Math.max((data.expires_in ?? 3600) - 300, 60));
  return data.access_token;
}

/** Fully honor Retry-After. Shared across instances, so one 429 backs everyone off. */
async function noteCooldown(key: string, res: Response) {
  const raw = Number(res.headers.get("Retry-After") || 60);
  const seconds = Number.isFinite(raw) && raw > 0 ? Math.ceil(raw) : 60;
  await getStore().set(key, 1, seconds);
  console.warn(`[spotify] 429 → ${key} for ${seconds}s`);
}

/** Reflects currently-playing only — that's what "is the widget live" means. */
export async function inCooldown(): Promise<boolean> {
  return getStore().exists(KEY_COOLDOWN_NOW);
}

export async function readPayload(): Promise<StoredPayload | null> {
  const stored = await getStore().get<StoredPayload>(KEY_PAYLOAD);
  if (!stored || !Array.isArray(stored.recent)) return null;
  return stored;
}

export function isStale(stored: StoredPayload | null): boolean {
  if (!stored) return true;
  return Date.now() - (stored.fetchedAt ?? 0) > REFRESH_INTERVAL_S * 1000;
}

/**
 * The single poller. Only ever runs on the instance that won KEY_LOCK, so
 * concurrent visitors collapse into one Spotify call per REFRESH_INTERVAL_S.
 */
export async function refreshFromSpotify(): Promise<void> {
  const s = getStore();

  const [nowBanned, recentBanned] = await Promise.all([
    s.exists(KEY_COOLDOWN_NOW),
    s.exists(KEY_COOLDOWN_RECENT),
  ]);

  const stored = await readPayload();
  const prevRecent = stored?.recent ?? [];
  let recentFetchedAt = stored?.recentFetchedAt;

  // Note: no `prevRecent.length === 0` clause. Retrying a banned endpoint every
  // 20s just because the list is empty is what turns a short 429 into a long one.
  const needRecent =
    !recentBanned &&
    (recentFetchedAt == null || Date.now() - recentFetchedAt >= RECENT_FETCH_TTL_MS);

  // Nothing we're allowed to ask for — don't even mint a token.
  if (nowBanned && !needRecent) return;

  const token = await getAccessToken();
  const auth = { Authorization: `Bearer ${token}` };

  const [nowRes, recentRes] = await Promise.all([
    nowBanned
      ? Promise.resolve(null)
      : fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: auth,
          cache: "no-store",
        }),
    needRecent
      ? fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
          headers: auth,
          cache: "no-store",
        })
      : Promise.resolve(null),
  ]);

  // Default to the stored track so a currently-playing 429 leaves the widget
  // showing the last known state rather than blanking it.
  let nowPlaying: TrackPayload | null = stored?.nowPlaying ?? null;
  if (nowRes) {
    if (nowRes.status === 200) {
      const d = (await nowRes.json()) as {
        item?: RawTrack | null;
        is_playing?: boolean;
        currently_playing_type?: string;
        progress_ms?: number;
      };
      nowPlaying =
        d?.item && d.currently_playing_type === "track"
          ? { ...shape(d.item), progressMs: d.progress_ms ?? 0, isPlaying: !!d.is_playing }
          : null;
    } else if (nowRes.status === 204) {
      // Nothing playing — clear it so the track demotes into recently played.
      nowPlaying = null;
    } else if (nowRes.status === 429) {
      await noteCooldown(KEY_COOLDOWN_NOW, nowRes);
    }
  }

  let liveRecent: TrackPayload[] | null = null;
  if (recentRes) {
    if (recentRes.status === 429) {
      await noteCooldown(KEY_COOLDOWN_RECENT, recentRes);
      // Still apply the now-playing update below; just stop asking for recent.
    } else if (recentRes.ok) {
      recentFetchedAt = Date.now();
      const json = (await recentRes.json()) as {
        items?: { track: RawTrack | null; played_at: string }[];
      };
      liveRecent = [];
      for (const it of json.items ?? []) {
        if (!it?.track?.id) continue;
        liveRecent.push(shape(it.track, it.played_at));
        if (liveRecent.length === RECENT_MAX) break;
      }
    }
  }

  let recent = liveRecent?.length ? mergeRecent(liveRecent, prevRecent) : prevRecent;

  // Promote the track that just left now-playing, so the list stays correct
  // between the sparse recently-played fetches.
  const prevNow = stored?.nowPlaying ?? null;
  if (prevNow && prevNow.id !== (nowPlaying?.id ?? null)) {
    recent = prependRecent(prevNow, recent);
  }

  const seen = new Set(nowPlaying ? [nowPlaying.id] : []);
  const deduped = recent
    .filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    })
    .slice(0, RECENT_MAX);

  await s.set(KEY_PAYLOAD, {
    nowPlaying,
    // Never clobber a known-good list with [] after a partial/failed fetch.
    recent: deduped.length > 0 ? deduped : prevRecent,
    fetchedAt: Date.now(),
    recentFetchedAt,
  } satisfies StoredPayload);
}
