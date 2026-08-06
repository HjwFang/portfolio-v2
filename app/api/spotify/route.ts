import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

type TrackPayload = {
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

type SpotifyPayload = {
  nowPlaying: TrackPayload | null;
  recent: TrackPayload[];
};

type PersistedState = SpotifyPayload & {
  /** Epoch ms — do not call Spotify player APIs before this (from Retry-After). */
  cooldownUntil?: number;
  /** Epoch ms — last successful recently-played fetch. */
  recentFetchedAt?: number;
};

/** Fresh enough for the widget; short so now-playing stays responsive. */
const CACHE_TTL_MS = 15_000;
/**
 * recently-played is far more sensitive than currently-playing.
 * Poll it sparingly; rely on server-side promotions between refreshes.
 */
const RECENT_FETCH_TTL_MS = 10 * 60_000;
const RECENT_MAX = 8;

const STALE_FILE = process.env.VERCEL
  ? join("/tmp", "spotify-last-good.json")
  : join(process.cwd(), ".spotify-cache.json");

type TrackMemory = {
  lastNow: TrackPayload | null;
  recent: TrackPayload[];
};

type SpotifyGlobal = typeof globalThis & {
  __spotifyTrackMemory?: TrackMemory;
  __spotifyPayloadCache?: { data: SpotifyPayload; freshUntil: number };
  __spotifyCooldownUntil?: number;
  __spotifyRecentFetchedAt?: number;
  __spotifyInflight?: Promise<SpotifyPayload> | null;
  __spotifyMetaLoaded?: boolean;
};

const g = globalThis as SpotifyGlobal;

function ensureMetaLoaded() {
  if (g.__spotifyMetaLoaded) return;
  g.__spotifyMetaLoaded = true;
  const stale = readStale();
  if (stale?.cooldownUntil) {
    g.__spotifyCooldownUntil = Math.max(
      g.__spotifyCooldownUntil ?? 0,
      stale.cooldownUntil
    );
  }
  if (stale?.recentFetchedAt) {
    g.__spotifyRecentFetchedAt = Math.max(
      g.__spotifyRecentFetchedAt ?? 0,
      stale.recentFetchedAt
    );
  }
}

function getMemory(): TrackMemory {
  ensureMetaLoaded();
  if (!g.__spotifyTrackMemory) g.__spotifyTrackMemory = loadMemory();
  return g.__spotifyTrackMemory;
}

function persistState(
  nowPlaying: TrackPayload | null,
  recent: TrackPayload[]
) {
  // Never clobber a known-good recent list with [] after a failed/rate-limited fetch.
  const prev = g.__spotifyTrackMemory?.recent ?? readStale()?.recent ?? [];
  const nextRecent = recent.length > 0 ? recent : prev;
  g.__spotifyTrackMemory = { lastNow: nowPlaying, recent: nextRecent };
  writeStale({
    nowPlaying,
    recent: nextRecent,
    cooldownUntil: g.__spotifyCooldownUntil,
    recentFetchedAt: g.__spotifyRecentFetchedAt,
  });
}

function getBasicAuth() {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
}

function readStale(): PersistedState | null {
  try {
    if (!existsSync(STALE_FILE)) return null;
    const data = JSON.parse(readFileSync(STALE_FILE, "utf8")) as PersistedState;
    if (!data || !Array.isArray(data.recent)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeStale(data: PersistedState) {
  try {
    writeFileSync(STALE_FILE, JSON.stringify(data), "utf8");
  } catch {
    /* ignore — /tmp and local cache are best-effort */
  }
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

function loadMemory(): TrackMemory {
  const stale = readStale();
  return {
    lastNow: stale?.nowPlaying ?? null,
    recent: Array.isArray(stale?.recent) ? stale.recent : [],
  };
}

function cachedPayload(): SpotifyPayload {
  const mem = getMemory();
  const stale = readStale();
  const recent =
    mem.recent.length > 0
      ? mem.recent
      : stale?.recent?.length
        ? stale.recent
        : [];
  return {
    nowPlaying: mem.lastNow ?? stale?.nowPlaying ?? null,
    recent,
  };
}

async function getAccessToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`spotify token ${res.status}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("spotify token missing");
  }
  return data.access_token;
}

function shape(
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
    external_urls: { spotify: string };
  },
  playedAt?: string
): TrackPayload {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    albumArt: track.album.images[2]?.url ?? track.album.images[0]?.url,
    url: track.external_urls.spotify,
    playedAt,
  };
}

/** Fully honor Retry-After (seconds). Persisted so cold starts don't re-hit. */
function noteCooldown(res: Response) {
  const raw = Number(res.headers.get("Retry-After") || 60);
  const waitMs = Number.isFinite(raw) ? Math.max(raw, 1) * 1000 : 60_000;
  g.__spotifyCooldownUntil = Math.max(
    g.__spotifyCooldownUntil ?? 0,
    Date.now() + waitMs
  );
  // Persist immediately so the next serverless instance backs off too.
  const mem = getMemory();
  writeStale({
    nowPlaying: mem.lastNow,
    recent: mem.recent,
    cooldownUntil: g.__spotifyCooldownUntil,
    recentFetchedAt: g.__spotifyRecentFetchedAt,
  });
}

function inCooldown() {
  ensureMetaLoaded();
  return Date.now() < (g.__spotifyCooldownUntil ?? 0);
}

async function fetchFromSpotify(): Promise<SpotifyPayload> {
  const mem = getMemory();
  if (mem.recent.length === 0) {
    const stale = readStale();
    if (stale?.recent?.length) mem.recent = stale.recent;
  }

  // Hard stop: any prior 429 means serve cache only until Retry-After elapses.
  // Continuing to poll currently-playing during a ban extends it (hours → days).
  if (inCooldown()) {
    return cachedPayload();
  }

  const token = await getAccessToken();
  const auth = { Authorization: `Bearer ${token}` };

  const now = Date.now();
  const recentFresh =
    g.__spotifyRecentFetchedAt != null &&
    now - g.__spotifyRecentFetchedAt < RECENT_FETCH_TTL_MS;
  const needRecent = mem.recent.length === 0 || !recentFresh;

  const nowPromise = fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    { headers: auth, cache: "no-store" }
  );
  const recentPromise = needRecent
    ? fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
        headers: auth,
        cache: "no-store",
      })
    : Promise.resolve(null);

  const [nowRes, recentRes] = await Promise.all([nowPromise, recentPromise]);

  let nowPlaying: TrackPayload | null = null;
  if (nowRes.status === 200) {
    const d = (await nowRes.json()) as {
      item?: Parameters<typeof shape>[0] | null;
      is_playing?: boolean;
      currently_playing_type?: string;
      progress_ms?: number;
    };
    if (d?.item && d.currently_playing_type === "track") {
      nowPlaying = {
        ...shape(d.item),
        progressMs: d.progress_ms ?? 0,
        isPlaying: !!d.is_playing,
      };
    }
  } else if (nowRes.status === 429) {
    noteCooldown(nowRes);
    return cachedPayload();
  }

  let liveRecent: TrackPayload[] | null = null;
  if (recentRes) {
    if (recentRes.status === 429) {
      noteCooldown(recentRes);
      // Still apply now-playing update below; just stop asking for recent.
    } else if (recentRes.ok) {
      g.__spotifyRecentFetchedAt = Date.now();
      const recentJson = (await recentRes.json()) as {
        items?: {
          track: Parameters<typeof shape>[0] | null;
          played_at: string;
        }[];
      };
      liveRecent = [];
      for (const it of recentJson.items ?? []) {
        if (!it?.track?.id) continue;
        liveRecent.push(shape(it.track, it.played_at));
        if (liveRecent.length === RECENT_MAX) break;
      }
    }
  }

  if (liveRecent && liveRecent.length > 0) {
    mem.recent = mergeRecent(liveRecent, mem.recent);
  }

  const prevId = mem.lastNow?.id ?? null;
  const nextId = nowPlaying?.id ?? null;
  if (mem.lastNow && prevId !== nextId) {
    mem.recent = prependRecent(mem.lastNow, mem.recent);
  }

  const seen = new Set(nowPlaying ? [nowPlaying.id] : []);
  const recent = mem.recent
    .filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    })
    .slice(0, RECENT_MAX);

  const payload: SpotifyPayload = {
    nowPlaying,
    recent:
      recent.length > 0
        ? recent
        : mem.recent
            .filter((t) => t.id !== nowPlaying?.id)
            .slice(0, RECENT_MAX),
  };
  persistState(nowPlaying, payload.recent);
  return payload;
}

async function getPayload(): Promise<SpotifyPayload> {
  const now = Date.now();
  const cached = g.__spotifyPayloadCache;
  if (cached && cached.freshUntil > now) {
    return cached.data;
  }

  // During Spotify cooldown, keep serving last-good without opening a new fetch.
  if (inCooldown()) {
    const data = cachedPayload();
    g.__spotifyPayloadCache = {
      data,
      freshUntil: now + CACHE_TTL_MS,
    };
    return data;
  }

  if (!g.__spotifyInflight) {
    g.__spotifyInflight = fetchFromSpotify()
      .then((data) => {
        g.__spotifyPayloadCache = {
          data,
          freshUntil: Date.now() + CACHE_TTL_MS,
        };
        return data;
      })
      .finally(() => {
        g.__spotifyInflight = null;
      });
  }

  try {
    return await g.__spotifyInflight;
  } catch {
    if (g.__spotifyPayloadCache) return g.__spotifyPayloadCache.data;
    return cachedPayload();
  }
}

export async function GET() {
  const data = await getPayload();
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
      "X-Spotify-Cache": inCooldown() ? "cooldown" : "live",
    },
  });
}
