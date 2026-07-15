"use client";

import CascadeIn from "@/components/CascadeIn";
import RankBadge from "@/components/RankBadge";
import RevealImage from "@/components/RevealImage";
import { useEffect, useLayoutEffect, useState } from "react";

import HeroShell from "@/components/HeroShell";
import PortfolioListCard from "@/components/PortfolioListCard";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import IndexedSelector from "@/components/IndexedSelector";
import { useHeroNavHoverContext } from "@/components/HeroNavHoverContext";
import CascadeReveal, { CascadeRevealHeading } from "@/components/CascadeReveal";
import { EXPERIENCE_GRID_ITEMS, PROJECT_GRID_ITEMS } from "@/lib/portfolioContent";
import { HERO_CASCADE, portfolioCardCascadeStep } from "@/lib/heroCascade";
import ArtGallery from "@/components/ArtGallery";
import { ART_PIECES } from "@/app/misc/art-data";
import {
  type MiscTab,
  readHomeNavigationFromUrl,
  writeMiscTabToUrl,
} from "@/lib/homeNavigation";

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
    coverArt: "/images/gaming/valorant-cover.png",
    coverAlt: "VALORANT key art poster",
    rank: "Ascendant II",
    rankIcon: "https://xpulz.com/img/game/valorant/tiers/ascendant2.png",
    accent: "#3ce0b5",
    coverPosition: "center center",
  },
  {
    title: "Teamfight Tactics",
    coverArt: "/images/gaming/tft-cover.png",
    coverAlt: "Teamfight Tactics key art",
    rank: "Plat II",
    rankIcon: "/images/gaming/tft-rank.png",
    accent: "#2ea3b0",
    coverPosition: "center center",
  },
  {
    title: "League of Legends",
    coverArt: "/images/gaming/league-cover.png",
    coverAlt: "League of Legends key art",
    rank: "Bronze IV",
    rankIcon: "/images/gaming/bronze-rank.png",
    accent: "#8b5b3c",
    coverPosition: "center top",
  },
] as const;

const MISC_TABS = [
  { id: "art", label: "art" },
  { id: "games", label: "games" },
  { id: "sports", label: "sports" },
] as const;

function GameCard({
  title,
  coverArt,
  coverAlt,
  rank,
  rankIcon,
  accent,
  coverPosition,
  cascadeBaseStep,
}: (typeof GAMES)[number] & { cascadeBaseStep?: number }) {
  const rankSizeClass =
    title === "VALORANT"
      ? "size-[clamp(72px,5vw,80px)]"
      : "size-[clamp(84px,6vw,96px)]";
  const cascadeOn = cascadeBaseStep !== undefined;
  const imagePriority = cascadeOn;

  const cover = (
    <>
      <RevealImage
        src={coverArt}
        alt={coverAlt}
        fill
        priority={imagePriority}
        sizes="(max-width: 640px) 42vw, (max-width: 1024px) 30vw, 13vw"
        className="object-cover"
        style={{ objectPosition: coverPosition }}
        placeholder="blur"
        blurDataURL={IMAGE_BLUR_DATA_URL}
      />
      <div className="absolute inset-0 bg-linear-to-t from-foreground/70 via-transparent to-transparent" />
    </>
  );

  const coverShellClassName =
    "relative h-full w-full overflow-hidden border border-foreground/10 bg-foreground/5 transition-colors duration-300";
  const rankShellClassName =
    "pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2";

  return (
    <div className="relative pb-[clamp(32px,4.5vw,48px)]">
      <div className="relative aspect-2/3 overflow-visible">
        {cascadeOn ? (
          <CascadeIn step={cascadeBaseStep} className={coverShellClassName}>
            {cover}
          </CascadeIn>
        ) : (
          <div className={coverShellClassName}>{cover}</div>
        )}
        {cascadeOn ? (
          <CascadeIn step={cascadeBaseStep + 1} className={rankShellClassName}>
            <RankBadge
              accent={accent}
              rankIcon={rankIcon}
              rank={rank}
              gameTitle={title}
              sizeClass={rankSizeClass}
              imageSizes="(max-width: 640px) 24vw, 6vw"
              priority={imagePriority}
            />
          </CascadeIn>
        ) : (
          <div className={rankShellClassName}>
            <RankBadge
              accent={accent}
              rankIcon={rankIcon}
              rank={rank}
              gameTitle={title}
              sizeClass={rankSizeClass}
              imageSizes="(max-width: 640px) 24vw, 6vw"
            />
          </div>
        )}
      </div>
    </div>
  );
}

const GAME_IMAGE_PRELOAD_SRCS = [
  "/images/gaming/valorant-cover.png",
  "/images/gaming/tft-cover.png",
  "/images/gaming/league-cover.png",
  "/images/gaming/tft-rank.png",
  "/images/gaming/bronze-rank.png",
  "https://xpulz.com/img/game/valorant/tiers/ascendant2.png",
] as const;

function SectionRenderer() {
  const context = useHeroNavHoverContext();
  const index = context?.hoveredIndex ?? 0;
  const [miscTab, setMiscTab] = useState<MiscTab>("art");

  useLayoutEffect(() => {
    const { miscTab: restoredTab } = readHomeNavigationFromUrl();
    setMiscTab(restoredTab);
  }, []);

  const handleMiscTabChange = (tab: MiscTab) => {
    setMiscTab(tab);
    writeMiscTabToUrl(tab);
  };

  useEffect(() => {
    if (index !== 2) return;
    for (const src of GAME_IMAGE_PRELOAD_SRCS) {
      const img = new window.Image();
      img.src = src;
    }
  }, [index]);

  const fillArtGallery = index === 2 && miscTab === "art";

  return (
    <div
      className={`flex w-full max-w-[92vw] flex-col gap-[clamp(16px,1.6vw,24px)] ${
        fillArtGallery ? "min-h-0 flex-1" : ""
      }`}
    >
      {index === 0 && (
        <section className="w-full">
          <CascadeRevealHeading
            step={HERO_CASCADE.main}
            className="mb-[clamp(16px,1.4vw,24px)] font-general font-medium lowercase text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground"
          >
            experiences
          </CascadeRevealHeading>
          <div className="grid w-full grid-cols-1 gap-x-[clamp(24px,3vw,48px)] gap-y-[clamp(24px,3vw,48px)] min-[480px]:grid-cols-2">
            {EXPERIENCE_GRID_ITEMS.map((item, i) => (
              <PortfolioListCard
                key={item.id}
                item={item}
                href={item.externalUrl}
                priority={i === 0}
                cascade={{ baseStep: portfolioCardCascadeStep(i) }}
              />
            ))}
          </div>
        </section>
      )}
      {index === 1 && (
        <section className="w-full">
          <CascadeRevealHeading
            step={HERO_CASCADE.main}
            className="mb-[clamp(16px,1.4vw,24px)] font-general font-medium lowercase text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground"
          >
            projects
          </CascadeRevealHeading>
          <div className="grid w-full grid-cols-1 gap-x-[clamp(24px,3vw,48px)] gap-y-[clamp(24px,3vw,48px)] min-[480px]:grid-cols-2">
            {PROJECT_GRID_ITEMS.map((item, i) => (
              <PortfolioListCard
                key={item.id}
                item={item}
                href={item.externalUrl ?? `/projects/${item.id}`}
                priority={i === 0}
                showSubtitle={false}
                cascade={{ baseStep: portfolioCardCascadeStep(i) }}
              />
            ))}
          </div>
        </section>
      )}
      {index === 2 && (
        <section
          className={`min-w-0 w-full ${fillArtGallery ? "flex min-h-0 flex-1 flex-col" : ""}`}
        >
          <CascadeReveal
            step={HERO_CASCADE.main}
            className="mb-[clamp(20px,2vh,28px)] flex w-full flex-wrap items-center justify-between gap-[clamp(16px,1.6vw,24px)]"
          >
            <h2 className="font-general font-medium text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground">
              misc gallery
            </h2>
            <IndexedSelector
              items={MISC_TABS}
              value={miscTab}
              onChange={(tab) => handleMiscTabChange(tab as MiscTab)}
              ariaLabel="Misc gallery selector"
              showArrow={false}
            />
          </CascadeReveal>

          <div
            className={`w-full transition-opacity duration-300 ${
              fillArtGallery ? "flex min-h-0 flex-1 flex-col" : ""
            }`}
          >
            {miscTab === "art" && (
              <div key="misc-art" className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
                <ArtGallery
                  pieces={ART_PIECES}
                  cascade
                  cascadeBaseStep={HERO_CASCADE.main + 1}
                  fillHeight
                />
              </div>
            )}

            {miscTab === "games" && (
              <div
                key="misc-games"
                className="grid w-full grid-cols-[repeat(auto-fill,minmax(0,clamp(160px,13vw,208px)))] justify-start gap-[clamp(16px,1.8vw,24px)]"
              >
                {GAMES.map((game, i) => (
                  <GameCard
                    key={game.title}
                    {...game}
                    cascadeBaseStep={HERO_CASCADE.main + 1 + i * 2}
                  />
                ))}
              </div>
            )}

            {miscTab === "sports" && (
              <div className="flex min-h-[clamp(140px,18vh,180px)] w-full items-center justify-center border border-dashed border-foreground/20">
                <span className="font-quicksand text-[clamp(12px,0.8vw,14px)] text-foreground/40">Stay tuned for highlights...</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
