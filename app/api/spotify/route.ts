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
};

type SpotifyPayload = {
  nowPlaying: TrackPayload | null;
  recent: TrackPayload[];
};

/** Fresh enough for the widget; short so now-playing stays responsive. */
const CACHE_TTL_MS = 15_000;

const STALE_FILE = process.env.VERCEL
  ? join("/tmp", "spotify-last-good.json")
  : join(process.cwd(), ".spotify-cache.json");

const SEED = spotifySeed as SpotifyPayload;

/** In-memory success cache (per server instance). */
let memoryCache: { data: SpotifyPayload; freshUntil: number } | null = null;
/** Only gate recently-played — currently-playing is a separate quota bucket. */
let recentCooldownUntil = 0;
let inflight: Promise<SpotifyPayload> | null = null;

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

function fallbackRecent(): TrackPayload[] {
  const stale = readStale();
  if (stale?.recent?.length) return stale.recent;
  return SEED.recent;
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
  // Cap so a multi-hour ban doesn't freeze recently-played forever in-process;
  // we still serve stale recent and keep polling currently-playing.
  const waitMs = Number.isFinite(raw)
    ? Math.min(Math.max(raw, 1) * 1000, 15 * 60_000)
    : 60_000;
  recentCooldownUntil = Math.max(recentCooldownUntil, Date.now() + waitMs);
}

async function fetchFromSpotify(): Promise<SpotifyPayload> {
  const token = await getAccessToken();
  const auth = { Authorization: `Bearer ${token}` };

  const skipRecent = Date.now() < recentCooldownUntil;

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
    if (d?.item && d.is_playing && d.currently_playing_type === "track") {
      nowPlaying = { ...shape(d.item), progressMs: d.progress_ms ?? 0 };
    }
  } else if (nowRes.status === 429) {
    // Unusual — currently-playing is usually fine; don't poison recent.
    noteRecentCooldown(nowRes);
  }

  let recent: TrackPayload[] | null = null;
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
      recent = [];
      const seen = new Set(nowPlaying ? [nowPlaying.id] : []);
      for (const it of recentJson.items ?? []) {
        if (!it?.track?.id) continue;
        if (seen.has(it.track.id)) continue;
        seen.add(it.track.id);
        recent.push(shape(it.track, it.played_at));
        if (recent.length === 8) break;
      }
    }
  }

  // Prefer live recent; otherwise last-good / seed so the list never goes blank.
  const recentFinal = recent ?? fallbackRecent();
  const seen = new Set(nowPlaying ? [nowPlaying.id] : []);
  const recentDeduped = recentFinal.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  const payload: SpotifyPayload = {
    nowPlaying,
    recent: recentDeduped.slice(0, 8),
  };

  // Only persist when we have a live recent list (avoid writing seed as "fresh").
  if (recent) {
    writeStale(payload);
  } else if (nowPlaying) {
    // Keep last-good recent, but refresh nowPlaying in the file for next boot.
    const stale = readStale();
    writeStale({
      nowPlaying,
      recent: stale?.recent?.length ? stale.recent : payload.recent,
    });
  }

  return payload;
}

async function getPayload(): Promise<SpotifyPayload> {
  const now = Date.now();
  if (memoryCache && memoryCache.freshUntil > now) {
    return memoryCache.data;
  }

  if (!inflight) {
    inflight = fetchFromSpotify()
      .then((data) => {
        memoryCache = { data, freshUntil: Date.now() + CACHE_TTL_MS };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }

  try {
    return await inflight;
  } catch {
    if (memoryCache) return memoryCache.data;
    const stale = readStale();
    if (stale && (stale.nowPlaying || stale.recent.length > 0)) return stale;
    return SEED;
  }
}

export async function GET() {
  const data = await getPayload();
  const fromLiveRecent = Date.now() >= recentCooldownUntil;
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
      "X-Spotify-Cache": fromLiveRecent ? "live" : "recent-stale",
    },
  });
}
