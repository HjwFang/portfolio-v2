import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  KEY_COOLDOWN_NOW,
  KEY_COOLDOWN_RECENT,
  KEY_PAYLOAD,
  REFRESH_INTERVAL_S,
  getStore,
  inCooldown,
  isStale,
  readPayload,
  refreshFromSpotify,
  type StoredPayload,
  type TrackPayload,
} from "./spotify";

function rawTrack(id: string, name = `Track ${id}`) {
  return {
    id,
    name,
    artists: [{ name: "Artist A" }, { name: "Artist B" }],
    album: { images: [{ url: "big" }, { url: "med" }, { url: "small" }] },
    external_urls: { spotify: `https://open.spotify.com/track/${id}` },
  };
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (k: string) => headers[k] ?? null },
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  // The memory store keeps its data in a Map hung off globalThis; clear its
  // contents in place so the module-level store singleton keeps working.
  const g = globalThis as typeof globalThis & {
    __spotifyMemStore?: Map<string, unknown>;
  };
  g.__spotifyMemStore?.clear();

  process.env.SPOTIFY_CLIENT_ID = "client-id";
  process.env.SPOTIFY_CLIENT_SECRET = "client-secret";
  process.env.SPOTIFY_REFRESH_TOKEN = "refresh-token";
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  vi.unstubAllGlobals();
});

const tokenResponse = jsonResponse(200, { access_token: "token-123", expires_in: 3600 });

describe("isStale", () => {
  it("treats a missing payload as stale", () => {
    expect(isStale(null)).toBe(true);
  });

  it("is fresh within the refresh interval", () => {
    const stored = { fetchedAt: Date.now() } as StoredPayload;
    expect(isStale(stored)).toBe(false);
  });

  it("is stale once the refresh interval has elapsed", () => {
    const stored = { fetchedAt: Date.now() - (REFRESH_INTERVAL_S * 1000 + 1) } as StoredPayload;
    expect(isStale(stored)).toBe(true);
  });
});

describe("readPayload", () => {
  it("returns null when nothing has been stored", async () => {
    expect(await readPayload()).toBeNull();
  });

  it("rejects a malformed payload without a recent array", async () => {
    await getStore().set(KEY_PAYLOAD, { nowPlaying: null });
    expect(await readPayload()).toBeNull();
  });

  it("returns a stored payload as-is", async () => {
    const stored: StoredPayload = { nowPlaying: null, recent: [], fetchedAt: Date.now() };
    await getStore().set(KEY_PAYLOAD, stored);
    expect(await readPayload()).toEqual(stored);
  });
});

describe("inCooldown", () => {
  it("is false with no cooldown key set", async () => {
    expect(await inCooldown()).toBe(false);
  });

  it("is true once the now-playing cooldown key is set", async () => {
    await getStore().setNx(KEY_COOLDOWN_NOW, 60);
    expect(await inCooldown()).toBe(true);
  });

  it("ignores the recent-only cooldown key", async () => {
    await getStore().setNx(KEY_COOLDOWN_RECENT, 60);
    expect(await inCooldown()).toBe(false);
  });
});

describe("refreshFromSpotify", () => {
  it("shapes and stores the currently-playing track", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(
        jsonResponse(200, {
          item: rawTrack("t1"),
          is_playing: true,
          currently_playing_type: "track",
          progress_ms: 5000,
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await refreshFromSpotify();

    const stored = await readPayload();
    expect(stored?.nowPlaying).toMatchObject({
      id: "t1",
      title: "Track t1",
      artist: "Artist A, Artist B",
      albumArt: "small",
      progressMs: 5000,
      isPlaying: true,
    });
  });

  it("caches the access token across refreshes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(jsonResponse(204, {}))
      .mockResolvedValueOnce(jsonResponse(204, {}));
    vi.stubGlobal("fetch", fetchMock);

    await refreshFromSpotify();
    await refreshFromSpotify();

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("accounts.spotify.com")
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it("clears now-playing on 204 and promotes the previous track into recent", async () => {
    const previous: TrackPayload = {
      id: "prev",
      title: "Previous",
      artist: "Someone",
      albumArt: "art",
      url: "https://open.spotify.com/track/prev",
      progressMs: 1000,
      isPlaying: true,
    };
    await getStore().set(KEY_PAYLOAD, {
      nowPlaying: previous,
      recent: [],
      fetchedAt: Date.now(),
      recentFetchedAt: Date.now(),
    } satisfies StoredPayload);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(jsonResponse(204, {}));
    vi.stubGlobal("fetch", fetchMock);

    await refreshFromSpotify();

    const stored = await readPayload();
    expect(stored?.nowPlaying).toBeNull();
    expect(stored?.recent[0]).toMatchObject({ id: "prev", title: "Previous" });
    // progress/isPlaying are stripped once a track demotes into recent.
    expect(stored?.recent[0]).not.toHaveProperty("progressMs");
    expect(stored?.recent[0]).not.toHaveProperty("isPlaying");
  });

  it("sets a cooldown and stops asking on a currently-playing 429, without dropping stored state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(jsonResponse(429, {}, { "Retry-After": "120" }));
    vi.stubGlobal("fetch", fetchMock);

    await refreshFromSpotify();

    expect(await inCooldown()).toBe(true);
    const stored = await readPayload();
    // Falls back to whatever was previously stored (nothing, here) rather than throwing.
    expect(stored?.nowPlaying).toBeNull();
  });

  it("does not fetch a token when now is banned and recent isn't due", async () => {
    await getStore().setNx(KEY_COOLDOWN_NOW, 300);
    await getStore().set(KEY_PAYLOAD, {
      nowPlaying: null,
      recent: [],
      fetchedAt: Date.now(),
      recentFetchedAt: Date.now(),
    } satisfies StoredPayload);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await refreshFromSpotify();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("merges freshly fetched recent tracks with the stored list, deduping by id", async () => {
    await getStore().set(KEY_PAYLOAD, {
      nowPlaying: null,
      recent: [
        {
          id: "old1",
          title: "Old",
          artist: "A",
          albumArt: "art",
          url: "u",
          playedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      fetchedAt: Date.now(),
      // Older than the 10-minute TTL so a recently-played fetch is due.
      recentFetchedAt: Date.now() - 11 * 60_000,
    } satisfies StoredPayload);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(jsonResponse(204, {}))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          items: [{ track: rawTrack("new1"), played_at: "2026-01-02T00:00:00.000Z" }],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await refreshFromSpotify();

    const stored = await readPayload();
    const ids = stored?.recent.map((t) => t.id);
    expect(ids).toEqual(["new1", "old1"]);
  });

  it("keeps the previous recent list on a recently-played 429", async () => {
    const prevRecent: TrackPayload[] = [
      { id: "keep", title: "Keep", artist: "A", albumArt: "art", url: "u" },
    ];
    await getStore().set(KEY_PAYLOAD, {
      nowPlaying: null,
      recent: prevRecent,
      fetchedAt: Date.now(),
      recentFetchedAt: Date.now() - 11 * 60_000,
    } satisfies StoredPayload);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(jsonResponse(204, {}))
      .mockResolvedValueOnce(jsonResponse(429, {}, { "Retry-After": "3600" }));
    vi.stubGlobal("fetch", fetchMock);

    await refreshFromSpotify();

    expect(await getStore().exists(KEY_COOLDOWN_RECENT)).toBe(true);
    const stored = await readPayload();
    expect(stored?.recent).toEqual(prevRecent);
  });

  it("throws and cools down both buckets on a token 429", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(429, {}, { "Retry-After": "60" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshFromSpotify()).rejects.toThrow("spotify token 429");

    expect(await getStore().exists(KEY_COOLDOWN_NOW)).toBe(true);
    expect(await getStore().exists(KEY_COOLDOWN_RECENT)).toBe(true);
  });
});
