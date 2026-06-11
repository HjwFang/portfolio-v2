import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import RankBadge from "@/components/RankBadge";
import SectionContent from "@/components/SectionContent";
import RevealImage from "@/components/RevealImage";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import ArtGallery from "@/components/ArtGallery";
import { ART_PIECES } from "./art-data";

type GameCard = {
  title: string;
  coverArt: string;
  coverAlt: string;
  rank: string;
  rankIcon: string;
  accent: string;
  titleClassName?: string;
  coverPosition?: string;
};

const GAMES: GameCard[] = [
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
    titleClassName: "max-w-[12ch]",
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
];

function GameTile({ title, coverArt, coverAlt, rank, rankIcon, accent, coverPosition }: GameCard) {
  const rankSizeClass =
    title === "VALORANT"
      ? "size-[clamp(5rem,12vw,6rem)]"
      : "size-[clamp(5.5rem,14vw,7rem)]";

  return (
    <article className="relative h-full pb-[clamp(2.5rem,8vw,3.5rem)]">
      <div className="relative aspect-2/3 overflow-visible">
        <CrossingCornerBorder bleed="8px" thickness="2px" className="h-full w-full text-foreground">
          <div className="relative h-full w-full overflow-hidden bg-foreground/5">
            <RevealImage
              src={coverArt}
              alt={coverAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-cover"
              style={{ objectPosition: coverPosition ?? "center center" }}
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/55 via-transparent to-transparent" />
          </div>
        </CrossingCornerBorder>
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
          <RankBadge
            accent={accent}
            rankIcon={rankIcon}
            rank={rank}
            gameTitle={title}
            sizeClass={rankSizeClass}
            imageSizes="(max-width: 768px) 25vw, 7vw"
          />
        </div>
      </div>
    </article>
  );
}

export default function MiscPage() {
  return (
    <div className="min-h-screen px-[clamp(24px,4.635vw,89px)]">
      <SectionContent aria-label="Miscellaneous">
        <div className="mb-[clamp(1.75rem,4vh,2.5rem)] flex items-center gap-3">
          <span className="size-3 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="m-0 font-general font-medium tracking-tight text-foreground text-[clamp(1.25rem,2.4vw,1.875rem)]">
            misc
          </h2>
        </div>

        <section
          aria-labelledby="art-heading"
          className="mb-[clamp(3rem,6vw,5rem)] flex min-w-0 w-full flex-col gap-[clamp(1.5rem,3vw,2rem)]"
        >
          <div className="max-w-[90vw]">
            <h3
              id="art-heading"
              className="font-general font-medium text-foreground text-[clamp(34px,4vw,56px)] tracking-tight m-0"
            >
              art
            </h3>
            <p className="mt-3 font-quicksand font-light leading-relaxed text-foreground/75 text-[clamp(0.9375rem,1.35vw,1.125rem)]">
              a selection of sketchbook pieces over the years — pencil, ink, oil pastel. tap any tile to view full size.
            </p>
          </div>

          <div className="min-w-0 w-full">
            <ArtGallery pieces={ART_PIECES} />
          </div>
        </section>

        <section aria-labelledby="games-heading" className="flex flex-col gap-[clamp(1.5rem,3vw,2rem)]">
          <div className="max-w-[90vw]">
            <h3
              id="games-heading"
              className="font-general font-medium text-foreground text-[clamp(34px,4vw,56px)] tracking-tight m-0"
            >
              games
            </h3>
            <p className="mt-3 font-quicksand font-light leading-relaxed text-foreground/75 text-[clamp(0.9375rem,1.35vw,1.125rem)]">
              the three games i queue the most right now, with the rank grind attached at the bottom.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-[clamp(1.5rem,3vw,2rem)] md:grid-cols-2 xl:grid-cols-3">
            {GAMES.map((game) => (
              <GameTile key={game.title} {...game} />
            ))}
          </div>
        </section>
      </SectionContent>
    </div>
  );
}
