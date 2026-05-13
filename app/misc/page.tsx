import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import SectionContent from "@/components/SectionContent";

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
    titleClassName: "max-w-[12ch]",
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
];

function GameTile({ title, coverArt, coverAlt, rank, rankIcon, accent, coverPosition }: GameCard) {
  return (
    <article className="relative h-full pb-14">
      <div className="relative aspect-2/3 overflow-visible">
        <CrossingCornerBorder bleed="8px" thickness="2px" className="text-foreground">
          <div className="relative h-full w-full overflow-hidden bg-foreground/5">
            <img
              src={coverArt}
              alt={coverAlt}
              className="h-full w-full object-cover"
              style={{ objectPosition: coverPosition ?? "center center" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/55 via-transparent to-transparent" />
          </div>
        </CrossingCornerBorder>
        <div
          className={`pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 ${
            title === "VALORANT" ? "h-24 w-24" : "h-28 w-28"
          }`}
        >
          <div
            className="absolute inset-[18%] rounded-full opacity-70 blur-[22px]"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
          <img
            src={rankIcon}
            alt={`${title} rank icon for ${rank}`}
            className={`relative object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.35)] ${
              title === "VALORANT" ? "h-24 w-24" : "h-28 w-28"
            }`}
          />
        </div>
      </div>
    </article>
  );
}

export default function MiscPage() {
  return (
    <div className="min-h-screen px-[5vw] lg:px-[89px]">
      <SectionContent aria-label="Miscellaneous">
        <div className="flex items-center gap-3 mb-10">
          <span className="size-3 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="font-general font-medium text-foreground text-2xl lg:text-3xl tracking-tight m-0">
            misc
          </h2>
        </div>

        <section aria-labelledby="games-heading" className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h3
              id="games-heading"
              className="font-general font-medium text-foreground text-[clamp(34px,4vw,56px)] tracking-tight m-0"
            >
              games
            </h3>
            <p className="mt-3 font-quicksand font-light text-base leading-relaxed text-foreground/75">
              the three games i queue the most right now, with the rank grind attached at the bottom.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {GAMES.map((game) => (
              <GameTile key={game.title} {...game} />
            ))}
          </div>
        </section>
      </SectionContent>
    </div>
  );
}
