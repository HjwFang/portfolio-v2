import RevealImage from "@/components/RevealImage";
import Link from "next/link";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import type { PortfolioCardItem } from "@/lib/portfolioContent";

type PortfolioListCardProps = {
  item: PortfolioCardItem;
  /** Omit for non-navigating cards (e.g. experiences shown only in the home SPA). */
  href?: string;
  priority?: boolean;
  /** When false, hides the subtitle line (e.g. role) between title and description. */
  showSubtitle?: boolean;
};

const cardClassName =
  "group flex w-full flex-col gap-[clamp(4px,0.4vw,8px)] text-left no-underline";

export default function PortfolioListCard({
  item,
  href,
  priority = false,
  showSubtitle = true,
}: PortfolioListCardProps) {
  const { title, date, subtitle, description, image } = item;
  const isCompactCardImage =
    item.id === "trudeau-sac" ||
    item.id === "watsapp" ||
    item.id === "unicook";
  const isAtaraxiaCard = item.id === "ataraxia";
  const isQuickposCard = item.id === "quickpos";
  const isTsacCard = item.id === "trudeau-sac";
  const isUnicookCard = item.id === "unicook";

  const body = (
    <>
      <div
        className={`relative flex w-full aspect-4/2.5 overflow-hidden border border-foreground/10 transition-colors duration-200 group-hover:border-foreground/20 ${
          isAtaraxiaCard
            ? "items-center justify-center bg-[#FFFFFF]"
            : isCompactCardImage
              ? "items-center justify-center bg-[#FFFFFF] p-[clamp(8px,1.4vw,16px)]"
              : isQuickposCard
                ? "items-center justify-center bg-[#FFFFFF]"
                : "bg-transparent"
        }`}
      >
        {isCompactCardImage ? (
          isUnicookCard ? (
            <RevealImage
              src={image}
              alt={title}
              width={97}
              height={18}
              priority={priority}
              className="h-[10px] w-auto max-w-[min(72vw,8.5rem)] object-contain object-center sm:h-[11px]"
              sizes="120px"
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
            />
          ) : (
            <div
              className={
                isTsacCard
                  ? "relative h-[min(28%,5.5rem)] w-[min(22%,5rem)] max-h-[58%] max-w-[40%] sm:h-[min(30%,5.85rem)] sm:w-[min(24%,5.35rem)]"
                  : "relative h-[min(38%,7.75rem)] w-[min(28%,6.5rem)] max-h-[82%] max-w-[52%] sm:h-[min(40%,8.25rem)] sm:w-[min(30%,7rem)]"
              }
            >
              <RevealImage
                src={image}
                alt={title}
                fill
                priority={priority}
                className="object-contain object-center"
                sizes={
                  isTsacCard
                    ? "(max-width: 768px) 40vw, (max-width: 1200px) 22vw, min(140px, 18vw)"
                    : "(max-width: 768px) 45vw, (max-width: 1200px) 24vw, min(180px, 20vw)"
                }
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
              />
            </div>
          )
        ) : isQuickposCard ? (
          <div className="relative h-[70%] w-[94%] max-h-[85%] max-w-[98%]">
            <RevealImage
              src={image}
              alt={title}
              fill
              priority={priority}
              className="object-contain object-center"
              sizes="(max-width: 768px) 96vw, (max-width: 1200px) 48vw, min(380px, 36vw)"
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
            />
          </div>
        ) : isAtaraxiaCard ? (
          <div className="relative h-[min(46%,8.75rem)] w-[min(46%,9.5rem)] max-h-[58%] max-w-[62%] sm:h-[min(48%,9.25rem)] sm:w-[min(48%,10rem)]">
            <RevealImage
              src={image}
              alt={title}
              fill
              priority={priority}
              className="object-contain object-center"
              sizes="(max-width: 768px) 62vw, (max-width: 1200px) 32vw, min(200px, 28vw)"
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
            />
          </div>
        ) : (
          <RevealImage
            src={image}
            alt={title}
            fill
            priority={priority}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, min(480px, 35vw)"
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
          />
        )}
      </div>

      <div className="mt-[clamp(4px,0.4vw,8px)] flex items-baseline justify-between gap-[clamp(10px,0.9vw,14px)]">
        <span className="truncate font-general font-medium text-[clamp(11px,0.833vw,14px)] leading-snug text-foreground">
          {title}
        </span>
        <span className="shrink-0 whitespace-nowrap font-quicksand font-light text-[clamp(8px,0.5vw,10px)] text-foreground/65 tabular-nums">
          {date}
        </span>
      </div>

      <div className="flex flex-col gap-[clamp(4px,0.4vw,8px)]">
        {showSubtitle ? (
          <span className="font-quicksand font-medium text-[clamp(10px,0.677vw,12px)] tracking-wide text-foreground/75">
            {subtitle}
          </span>
        ) : null}
        <p className="m-0 line-clamp-2 font-quicksand font-light text-[clamp(9px,0.625vw,11px)] leading-snug text-foreground/60">
          {description}
        </p>
      </div>
    </>
  );

  if (href != null) {
    return (
      <Link href={href} className={cardClassName}>
        {body}
      </Link>
    );
  }

  return <div className={cardClassName}>{body}</div>;
}
