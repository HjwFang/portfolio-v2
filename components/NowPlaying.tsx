"use client";
import { useEffect, useState } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  url: string;
  playedAt?: string;
};

const WAVE_HEIGHTS = [
  40, 70, 100, 55, 85, 45, 95, 60, 30, 75, 100, 50, 80, 40, 65, 90, 55, 35,
];

function SoundWave() {
  return (
    <div className="flex items-center gap-[2px] h-[clamp(9px,0.7vw,12px)]" aria-hidden>
      {WAVE_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="now-playing-bar w-[1.5px] rounded-full bg-light-brown"
          style={{ height: `${h}%`, animationDelay: `${(i % 5) * 0.12}s` }}
        />
      ))}
    </div>
  );
}

function SectionHeader({
  children,
  wave,
  cascadeStep = 0,
}: {
  children: React.ReactNode;
  wave?: boolean;
  cascadeStep?: number;
}) {
  return (
    <div
      style={{ "--cascade-step": cascadeStep } as React.CSSProperties}
      className="now-playing-cascade flex items-center gap-[clamp(8px,0.8vw,12px)] mb-[clamp(5px,0.4vw,9px)]"
    >
      <span className="font-general font-medium leading-snug text-foreground text-[clamp(11px,0.833vw,14px)] whitespace-nowrap">
        {children}
      </span>
      {wave && (
        <div className="min-w-0 flex-1 overflow-hidden">
          <SoundWave />
        </div>
      )}
    </div>
  );
}

function Row({ track, cascadeStep = 0 }: { track: Track; cascadeStep?: number }) {
  return (
    <a
      href={track.url}
      target="_blank"
      rel="noreferrer"
      style={{ "--cascade-step": cascadeStep } as React.CSSProperties}
      className="now-playing-cascade flex min-h-0 flex-1 items-center gap-[clamp(8px,0.8vw,12px)] group/row"
    >
      <img
        src={track.albumArt}
        alt=""
        className="aspect-square h-[70%] max-h-[clamp(30px,2.6vw,40px)] object-cover shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-general text-foreground group-hover/row:underline text-[clamp(11px,0.75vw,14px)]">
          {track.title}
        </div>
        <div className="truncate font-quicksand font-medium leading-snug text-foreground/60 text-[clamp(10px,0.677vw,12px)]">
          {track.artist}
        </div>
      </div>
    </a>
  );
}

export function NowPlaying() {
  const [data, setData] = useState<{ nowPlaying: Track | null; recent: Track[] } | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/spotify")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (!data)
    return (
      <div className="font-quicksand font-light text-foreground/40 text-[clamp(9px,0.62vw,12px)]">
        loading…
      </div>
    );

  const featured = data.nowPlaying ?? data.recent[0] ?? null;
  const rest = data.nowPlaying ? data.recent : data.recent.slice(1);
  const tracklist = rest.slice(0, 3);

  // Running index so headers + rows cascade sequentially from top to bottom.
  let step = 0;

  return (
    <div className="flex h-full w-full flex-col gap-[clamp(10px,0.9vw,16px)]">
      {featured && (
        <div className="flex min-h-0 flex-[1.4] flex-col">
          <SectionHeader wave={!!data.nowPlaying} cascadeStep={step++}>
            {data.nowPlaying ? "now playing" : "last played"}
          </SectionHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <Row track={featured} cascadeStep={step++} />
          </div>
        </div>
      )}
      {tracklist.length > 0 && (
        <div className="flex min-h-0 flex-[3] flex-col">
          <SectionHeader cascadeStep={step++}>recently played</SectionHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            {tracklist.map((t) => (
              <Row key={t.id + t.playedAt} track={t} cascadeStep={step++} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
