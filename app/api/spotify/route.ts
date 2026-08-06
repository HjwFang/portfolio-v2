import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import spotifySeed from "@/lib/spotifySeed.json";

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

/** Fresh enough for the widget; short so now-playing stays responsive. */
const CACHE_TTL_MS = 15_000;
const RECENT_MAX = 8;

const STALE_FILE = process.env.VERCEL
  ? join("/tmp", "spotify-last-good.json")
  : join(process.cwd(), ".spotify-cache.json");

const SEED = spotifySeed as SpotifyPayload;

type TrackMemory = {
  /** Last observed now-playing track (may include progressMs). */
  lastNow: TrackPayload | null;
  /** Rolling recently-played, including server-side promotions. */
  recent: TrackPayload[];
};

type SpotifyGlobal = typeof globalThis & {
  __spotifyTrackMemory?: TrackMemory;
  __spotifyPayloadCache?: { data: SpotifyPayload; freshUntil: number };
  __spotifyRecentCooldownUntil?: number;
  __spotifyInflight?: Promise<SpotifyPayload> | null;
};

const g = globalThis as SpotifyGlobal;

function getMemory(): TrackMemory {
  if (!g.__spotifyTrackMemory) g.__spotifyTrackMemory = loadMemory();
  return g.__spotifyTrackMemory;
}

function persistMemory(nowPlaying: TrackPayload | null, recent: TrackPayload[]) {
  g.__spotifyTrackMemory = { lastNow: nowPlaying, recent };
  writeStale({ nowPlaying, recent });
}

function getBasicAuth() {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
}

function readStale(): SpotifyPayload | null {
  try {
    if (!existsSync(STALE_FILE)) return null;
    const data = JSON.parse(readFileSync(STALE_FILE, "utf8")) as SpotifyPayload;
    if (!data || !Array.isArray(data.recent)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeStale(data: SpotifyPayload) {
  try {
    writeFileSync(STALE_FILE, JSON.stringify(data), "utf8");
  } catch {
    /* ignore */
  }
}

function withoutProgress(track: TrackPayload): TrackPayload {
  const { progressMs: _p, ...rest } = track;
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
    out.push(t);
    if (out.length === RECENT_MAX) break;
  }
  return out;
}

function loadMemory(): TrackMemory {
  const stale = readStale();
  return {
    lastNow: stale?.nowPlaying ?? null,
    recent: stale?.recent?.length ? stale.recent : [...SEED.recent],
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

function noteRecentCooldown(res: Response) {
  const raw = Number(res.headers.get("Retry-After") || 60);
  const waitMs = Number.isFinite(raw)
    ? Math.min(Math.max(raw, 1) * 1000, 15 * 60_000)
    : 60_000;
  g.__spotifyRecentCooldownUntil = Math.max(
    g.__spotifyRecentCooldownUntil ?? 0,
    Date.now() + waitMs
  );
}

async function fetchFromSpotify(): Promise<SpotifyPayload> {
  const mem = getMemory();
  const token = await getAccessToken();
  const auth = { Authorization: `Bearer ${token}` };

  const skipRecent = Date.now() < (g.__spotifyRecentCooldownUntil ?? 0);

  const nowPromise = fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    { headers: auth, cache: "no-store" }
  );
  const recentPromise = skipRecent
    ? Promise.resolve(null)
    : fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
        headers: auth,
        cache: "no-store",
      });

  const [nowRes, recentRes] = await Promise.all([nowPromise, recentPromise]);

  let nowPlaying: TrackPayload | null = null;
  if (nowRes.status === 200) {
    const d = (await nowRes.json()) as {
      item?: Parameters<typeof shape>[0] | null;
      is_playing?: boolean;
      currently_playing_type?: string;
      progress_ms?: number;
    };
    // Keep the current item even when paused so we don't lose it before a skip,
    // and so progressMs keeps updating for promotion / FLIP.
    if (d?.item && d.currently_playing_type === "track") {
      nowPlaying = {
        ...shape(d.item),
        progressMs: d.progress_ms ?? 0,
        isPlaying: !!d.is_playing,
      };
    }
  } else if (nowRes.status === 429) {
    noteRecentCooldown(nowRes);
  }

  let liveRecent: TrackPayload[] | null = null;
  if (recentRes) {
    if (recentRes.status === 429) {
      noteRecentCooldown(recentRes);
    } else if (recentRes.ok) {
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

  // Spotify's recently-played feed lags (and skips short plays). Merge it first,
  // then prepend our own observation so a just-finished track can't be dropped
  // when Spotify returns a full page that doesn't include it yet.
  if (liveRecent) {
    mem.recent = mergeRecent(liveRecent, mem.recent);
  }

  const prevId = mem.lastNow?.id ?? null;
  const nextId = nowPlaying?.id ?? null;
  if (mem.lastNow && prevId !== nextId) {
    mem.recent = prependRecent(mem.lastNow, mem.recent);
  }

  const seen = new Set(nowPlaying ? [nowPlaying.id] : []);
  const recent = mem.recent.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).slice(0, RECENT_MAX);

  const payload: SpotifyPayload = { nowPlaying, recent };
  persistMemory(nowPlaying, recent);
  return payload;
}

async function getPayload(): Promise<SpotifyPayload> {
  const now = Date.now();
  const cached = g.__spotifyPayloadCache;
  if (cached && cached.freshUntil > now) {
    return cached.data;
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
    const mem = getMemory();
    return { nowPlaying: null, recent: mem.recent };
  }
}

export async function GET() {
  const data = await getPayload();
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
      "X-Spotify-Cache":
        Date.now() >= (g.__spotifyRecentCooldownUntil ?? 0)
          ? "live"
          : "recent-remembered",
    },
  });
}
