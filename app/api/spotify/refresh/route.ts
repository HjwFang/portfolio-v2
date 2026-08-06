import { refreshFromSpotify } from "@/lib/spotify";

export const dynamic = "force-dynamic";

/**
 * Manual / scheduled warm of the cache. Not needed in normal operation — the
 * read route self-refreshes — but lets you prime an empty store or attach a
 * cron later without touching the design.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("Authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  try {
    await refreshFromSpotify();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[spotify] manual refresh failed", err);
    return Response.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
