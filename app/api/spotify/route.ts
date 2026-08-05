export const revalidate = 0;

const basic = Buffer.from(
  `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
).toString("base64");

async function getAccessToken() {
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
  const { access_token } = await res.json();
  return access_token;
}

function shape(track: any, playedAt?: string) {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    albumArt: track.album.images[2]?.url ?? track.album.images[0]?.url,
    url: track.external_urls.spotify,
    playedAt,
  };
}

export async function GET() {
  const token = await getAccessToken();
  const auth = { Authorization: `Bearer ${token}` };

  const [nowRes, recentRes] = await Promise.all([
    fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: auth,
      cache: "no-store",
    }),
    fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
      headers: auth,
      cache: "no-store",
    }),
  ]);

  let nowPlaying = null;
  if (nowRes.status === 200) {
    const d = await nowRes.json();
    if (d?.item && d.is_playing && d.currently_playing_type === "track") {
      nowPlaying = { ...shape(d.item), progressMs: d.progress_ms ?? 0 };
    }
  }

  const { items = [] } = await recentRes.json();

  const seen = new Set(nowPlaying ? [nowPlaying.id] : []);
  const recent = [];
  for (const it of items) {
    if (seen.has(it.track.id)) continue;
    seen.add(it.track.id);
    recent.push(shape(it.track, it.played_at));
    if (recent.length === 8) break;
  }

  return Response.json({ nowPlaying, recent });
}