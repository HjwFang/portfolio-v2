"use client";

import RevealImage from "@/components/RevealImage";
import { useEffect, useState } from "react";

import HeroShell from "@/components/HeroShell";
import PortfolioListCard from "@/components/PortfolioListCard";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import IndexedSelector from "@/components/IndexedSelector";
import { useHeroNavHoverContext } from "@/components/HeroNavHoverContext";
import { EXPERIENCE_GRID_ITEMS, PROJECT_GRID_ITEMS } from "@/lib/portfolioContent";
import ArtGallery from "@/components/ArtGallery";
import { ART_PIECES } from "@/app/misc/art-data";

export default function Home() {
  return (
    <HeroShell>
      <SectionRenderer />
    </HeroShell>
  );
}

const GAMES = [
  {
    title: "VALORANT",
    coverArt: "/valorant-cover.png",
    coverAlt: "VALORANT key art poster",
    rank: "Ascendant II",
    rankIcon: "https://xpulz.com/img/game/valorant/tiers/ascendant2.png",
    accent: "#3ce0b5",
    coverPosition: "center center",
  },
  {
    title: "Teamfight Tactics",
    coverArt: "/tft-cover.png",
    coverAlt: "Teamfight Tactics key art",
    rank: "Plat II",
    rankIcon: "/tft-rank.png",
    accent: "#2ea3b0",
    coverPosition: "center center",
  },
  {
    title: "League of Legends",
    coverArt: "/league-cover.png",
    coverAlt: "League of Legends key art",
    rank: "Bronze IV",
    rankIcon: "/bronze-rank.png",
    accent: "#8b5b3c",
    coverPosition: "center top",
  },
] as const;

const MISC_TABS = [
  { id: "art", label: "art" },
  { id: "games", label: "games" },
  { id: "sports", label: "sports" },
] as const;

type MiscTab = (typeof MISC_TABS)[number]["id"];


function GameCard({
  title,
  coverArt,
  coverAlt,
  rank,
  rankIcon,
  accent,
  coverPosition,
}: (typeof GAMES)[number]) {
  const rankSizeClass =
    title === "VALORANT"
      ? "size-[clamp(72px,5vw,80px)]"
      : "size-[clamp(84px,6vw,96px)]";

  return (
    <div className="relative pb-[clamp(32px,4.5vw,48px)]">
      <div className="relative aspect-2/3 overflow-visible">
        <div className="relative h-full w-full overflow-hidden border border-foreground/10 bg-foreground/5 transition-colors duration-300">
          <RevealImage
            src={coverArt}
            alt={coverAlt}
            fill
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 30vw, 13vw"
            className="object-cover"
            style={{ objectPosition: coverPosition }}
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
          />
          <div className="absolute inset-0 bg-linear-to-t from-foreground/70 via-transparent to-transparent" />
        </div>
        <div
          className={`pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 ${rankSizeClass}`}
        >
          <div
            className="absolute inset-[18%] rounded-full opacity-70 blur-[clamp(14px,1.25vw,18px)]"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
          <RevealImage
            src={rankIcon}
            alt={`${title} rank icon for ${rank}`}
            fill
            sizes="(max-width: 640px) 24vw, 6vw"
            className="object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.35)]"
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
          />
        </div>
      </div>
    </div>
  );
}

const GAME_IMAGE_PRELOAD_SRCS = [
  "/valorant-cover.png",
  "/tft-cover.png",
  "/league-cover.png",
  "/tft-rank.png",
  "/bronze-rank.png",
  "https://xpulz.com/img/game/valorant/tiers/ascendant2.png",
] as const;

function SectionRenderer() {
  const context = useHeroNavHoverContext();
  const index = context?.hoveredIndex ?? 0;
  const [miscTab, setMiscTab] = useState<MiscTab>("art");

  useEffect(() => {
    if (index !== 2) return;
    for (const src of GAME_IMAGE_PRELOAD_SRCS) {
      const img = new window.Image();
      img.src = src;
    }
  }, [index]);

  return (
    <div className="flex w-full max-w-[92vw] flex-col gap-[clamp(16px,1.6vw,24px)]">
      {index === 0 && (
        <section className="w-full">
          <h2 className="mb-[clamp(16px,1.4vw,24px)] font-general font-medium lowercase text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground">
            experiences
          </h2>
          <div className="grid w-full grid-cols-2 gap-x-[clamp(24px,3vw,48px)] gap-y-[clamp(24px,3vw,48px)]">
            {EXPERIENCE_GRID_ITEMS.map((item, i) => (
              <PortfolioListCard key={item.id} item={item} priority={i === 0} />
            ))}
          </div>
        </section>
      )}
      {index === 1 && (
        <section className="w-full">
          <h2 className="mb-[clamp(16px,1.4vw,24px)] font-general font-medium lowercase text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground">
            projects
          </h2>
          <div className="grid w-full grid-cols-2 gap-x-[clamp(24px,3vw,48px)] gap-y-[clamp(24px,3vw,48px)]">
            {PROJECT_GRID_ITEMS.map((item, i) => (
              <PortfolioListCard
                key={item.id}
                item={item}
                href={`/projects/${item.id}`}
                priority={i === 0}
                showSubtitle={false}
              />
            ))}
          </div>
        </section>
      )}
      {index === 2 && (
        <section className="min-w-0 w-full">
          <div className="mb-[clamp(20px,2vh,28px)] flex w-full flex-wrap items-center justify-between gap-[clamp(16px,1.6vw,24px)]">
            <h2 className="font-general font-medium text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground">
              misc gallery
            </h2>
            <IndexedSelector
              items={MISC_TABS}
              value={miscTab}
              onChange={(tab) => setMiscTab(tab as MiscTab)}
              ariaLabel="Misc gallery selector"
              showArrow={false}
            />
          </div>

          <div className="w-full transition-opacity duration-300">
            {miscTab === "art" && (
              <div className="min-w-0 w-full">
                <ArtGallery pieces={ART_PIECES} />
              </div>
            )}

            {miscTab === "games" && (
              <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(0,clamp(160px,13vw,208px)))] justify-start gap-[clamp(16px,1.8vw,24px)]">
                {GAMES.map((game) => (
                  <GameCard key={game.title} {...game} />
                ))}
              </div>
            )}

            {miscTab === "sports" && (
              <div className="flex min-h-[clamp(140px,18vh,180px)] w-full items-center justify-center border border-dashed border-foreground/20">
                <span className="font-quicksand text-[clamp(12px,0.8vw,14px)] text-foreground/40">Not sure yet</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
