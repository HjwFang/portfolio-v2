import { after } from "next/server";
import {
  KEY_LOCK,
  REFRESH_INTERVAL_S,
  getStore,
  inCooldown,
  isStale,
  readPayload,
  refreshFromSpotify,
} from "@/lib/spotify";

export const dynamic = "force-dynamic";

/**
 * Pure read. Always answers from the durable store and never blocks on Spotify.
 * When the payload goes stale, exactly one instance wins the lock and refreshes
 * out of band — so 1 visitor and 500 visitors cost the same Spotify quota.
 */
export async function GET() {
  const stored = await readPayload();
  let state: "hit" | "cooldown" | "empty" = stored ? "hit" : "empty";

  if (isStale(stored)) {
    if (await inCooldown()) {
      state = "cooldown";
    } else if (await getStore().setNx(KEY_LOCK, REFRESH_INTERVAL_S)) {
      // The lock is intentionally never released early — letting it expire is
      // what backs off a refresh that failed or hung.
      after(async () => {
        try {
          await refreshFromSpotify();
        } catch (err) {
          console.error("[spotify] refresh failed", err);
        }
      });
    }
  }

  return Response.json(
    { nowPlaying: stored?.nowPlaying ?? null, recent: stored?.recent ?? [] },
    { headers: { "Cache-Control": "no-store", "X-Spotify-Cache": state } }
  );
}
