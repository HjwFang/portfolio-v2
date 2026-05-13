"use client";

import { useState } from "react";

import HeroShell from "@/components/HeroShell";
import IndexedSelector from "@/components/IndexedSelector";
import { useHeroNavHoverContext } from "@/components/HeroNavHoverContext";

export default function Home() {
  return (
    <HeroShell>
      <SectionRenderer />
    </HeroShell>
  );
}

const EXPERIENCES = [
  {
    id: "quickpos",
    title: "Quickpos Technologies Inc.",
    date: "Jan 2026 – Apr 2026",
    subtitle: "Software Engineer Intern",
    description: "Specialized in RAG B2B SaaS, web development, and product design during a co-op term.",
  },
  {
    id: "ataraxia",
    title: "Ataraxia Apparel Inc.",
    date: "May 2025 – Sep 2025",
    subtitle: "Founder",
    description: "Founded and led a streetwear brand, managing product design with Adobe Illustrator and driving growth through social media marketing.",
  },
  {
    id: "trudeau-sac",
    title: "Trudeau Student Activities Council",
    date: "May 2024 – Jun 2025",
    subtitle: "Head of Publicity",
    description: "Directed publicity initiatives and managed social media presence, fostering community engagement through leadership and marketing.",
  },
];

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
  { id: "arts", label: "arts" },
  { id: "games", label: "games" },
  { id: "sports", label: "sports" },
] as const;

type MiscTab = (typeof MISC_TABS)[number]["id"];

function ExperienceCard({ title, date, subtitle, description }: (typeof EXPERIENCES)[number]) {
  return (
    <div className="flex flex-col gap-[clamp(4px,0.4vw,8px)] group w-full">
      {/* Image placeholder */}
      <div className="w-full aspect-4/2.5 bg-transparent border border-foreground/10 group-hover:border-foreground/20 transition-colors duration-200 overflow-hidden relative">
        <div className="absolute inset-0 bg-linear-to-br from-foreground/2 to-transparent flex items-center justify-center">
          <span className="font-general font-medium text-foreground/20 text-[clamp(9px,0.6vw,11px)] tracking-[0.2em] uppercase">
            {title.split(" ")[0]}
          </span>
        </div>
      </div>

      {/* Title row */}
      <div className="mt-[clamp(4px,0.4vw,8px)] flex items-baseline justify-between gap-[clamp(10px,0.9vw,14px)]">
        <span className="font-general font-medium text-foreground text-[clamp(11px,0.833vw,14px)] leading-snug truncate">
          {title}
        </span>
        <span className="font-quicksand font-light text-foreground/65 text-[clamp(8px,0.5vw,10px)] whitespace-nowrap shrink-0 tabular-nums">
          {date}
        </span>
      </div>

      {/* Subtitle & description */}
      <div className="flex flex-col gap-[clamp(4px,0.4vw,8px)]">
        <span className="font-quicksand font-medium text-foreground/75 text-[clamp(10px,0.677vw,12px)] tracking-wide">
          {subtitle}
        </span>
        <p className="font-quicksand font-light text-foreground/60 text-[clamp(9px,0.625vw,11px)] leading-snug line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}

function ArtPieceCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors duration-300 ${className}`}
    />
  );
}

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
        <div className="h-full w-full border border-foreground/10 transition-colors duration-300 relative overflow-hidden bg-foreground/5">
          <img
            src={coverArt}
            alt={coverAlt}
            className="h-full w-full object-cover"
            style={{ objectPosition: coverPosition }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-foreground/70 via-transparent to-transparent" />
        </div>
        <div className={`pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 ${rankSizeClass}`}>
          <div
            className="absolute inset-[18%] rounded-full opacity-70 blur-[clamp(14px,1.25vw,18px)]"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
          <img
            src={rankIcon}
            alt={`${title} rank icon for ${rank}`}
            className={`relative object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.35)] ${rankSizeClass}`}
          />
        </div>
      </div>
    </div>
  );
}

function SectionRenderer() {
  const context = useHeroNavHoverContext();
  const index = context?.hoveredIndex ?? 0;
  const [miscTab, setMiscTab] = useState<MiscTab>("arts");

  return (
    <div className="flex w-full max-w-4xl flex-col gap-[clamp(16px,1.6vw,24px)]">
      {index === 0 && (
        <section className="w-full">
          <h2 className="mb-[clamp(16px,1.4vw,24px)] font-general font-medium text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground">
            projects & experiences
          </h2>
          <div className="grid w-full grid-cols-2 gap-x-[clamp(24px,3vw,48px)] gap-y-[clamp(24px,3vw,48px)]">
            {EXPERIENCES.map((exp) => (
              <ExperienceCard key={exp.id} {...exp} />
            ))}
          </div>
        </section>
      )}
      {index === 1 && (
        <section className="w-full">
          <h2 className="mb-[clamp(16px,1.4vw,24px)] font-general font-medium text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground">
            about me
          </h2>
          <p className="w-full font-quicksand font-light text-[clamp(13px,1vw,17px)] leading-snug text-foreground/70">
            Student at University of Waterloo. Passionate about building tools that feel as good as they look.
            Focused on systems, graphics, and full-stack development.
          </p>
        </section>
      )}
      {index === 2 && (
        <section className="w-full">
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
            {miscTab === "arts" && (
              <div className="grid w-full grid-cols-3 auto-rows-[clamp(72px,5.5vw,96px)] gap-[clamp(8px,0.7vw,12px)]">
                <ArtPieceCard className="col-span-2 row-span-2" />
                <ArtPieceCard className="col-span-1 row-span-1" />
                <ArtPieceCard className="col-span-1 row-span-2" />
                <ArtPieceCard className="col-span-1 row-span-1" />
                <ArtPieceCard className="col-span-2 row-span-1" />
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
