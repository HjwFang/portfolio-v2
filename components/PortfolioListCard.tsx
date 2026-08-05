import CascadeIn from "@/components/CascadeIn";
import RevealImage from "@/components/RevealImage";
import Link from "next/link";
import type { CSSProperties } from "react";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import type { PortfolioCardItem } from "@/lib/portfolioContent";

export type PortfolioListCardCascade = {
  /**
   * Global stagger index for this card’s first beat (image). Use row-major grid order
   * (top-left → bottom-right): card 0 = 0, card 1 = 3, card 2 = 6, … with 3 beats per card.
   */
  baseStep: number;
};

type PortfolioListCardProps = {
  item: PortfolioCardItem;
  /** When set, only the image is clickable (text stays plain). External URLs open in a new tab. */
  href?: string;
  priority?: boolean;
  /** When false, hides the subtitle line (e.g. role) between title and description. */
  showSubtitle?: boolean;
  /**
   * Row-wise cascade: image, then title + date + subtitle together, then description.
   * When set, image reveal uses eager load so motion stays in sync with the shell.
   */
  cascade?: PortfolioListCardCascade;
};

const cardClassName =
  "flex w-full flex-col gap-[clamp(4px,0.4vw,8px)] text-left";

export default function PortfolioListCard({
  item,
  href,
  priority = false,
  showSubtitle = true,
  cascade,
}: PortfolioListCardProps) {
  const { title, date, subtitle, description, image } = item;
  const imagePriority = cascade ? true : priority;
  const cascadeStep = (n: number): CSSProperties | undefined =>
    cascade
      ? ({
          ["--cascade-step" as string]: cascade.baseStep + n,
        } as CSSProperties)
      : undefined;
  const cascadeClass = cascade ? "portfolio-cascade-in" : "";
  const isCompactCardImage =
    item.id === "trudeau-sac" ||
    item.id === "grewal-guyatt" ||
    item.id === "watsapp" ||
    item.id === "unicook";
  const isAtaraxiaCard = item.id === "ataraxia";
  const isAtrxCard = item.id === "atrx";
  const isQuickposCard = item.id === "quickpos";
  const isTsacCard = item.id === "trudeau-sac";
  const isGrewalCard = item.id === "grewal-guyatt";
  const isUnicookCard = item.id === "unicook";
  const isExternal = href != null && /^https?:\/\//.test(href);

  const imageBoxClassName = `relative flex w-full aspect-4/2.5 overflow-hidden border border-foreground/10 ${
    href != null ? "portfolio-card-image-link hover:border-foreground/20" : ""
  } ${
    isAtaraxiaCard || isAtrxCard
      ? "items-center justify-center bg-[#FFFFFF]"
      : isCompactCardImage
        ? "items-center justify-center bg-[#FFFFFF] p-[clamp(8px,1.4vw,16px)]"
        : isQuickposCard
          ? "items-center justify-center bg-[#FFFFFF]"
          : "bg-transparent"
  }`;

  const imageBox = (
    <>
      {isCompactCardImage ? (
          isUnicookCard ? (
            <RevealImage
              src={image}
              alt={title}
              width={97}
              height={18}
              priority={imagePriority}
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
                  : isGrewalCard
                    ? "relative h-[min(40%,6rem)] w-[min(40%,6rem)] max-h-[62%] max-w-[46%] sm:h-[min(42%,6.4rem)] sm:w-[min(42%,6.4rem)]"
                    : "relative h-[min(38%,7.75rem)] w-[min(28%,6.5rem)] max-h-[82%] max-w-[52%] sm:h-[min(40%,8.25rem)] sm:w-[min(30%,7rem)]"
              }
            >
              <RevealImage
                src={image}
                alt={title}
                fill
                priority={imagePriority}
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
              priority={imagePriority}
              wrapClassName="bg-[#FFFFFF]"
              className="object-contain object-center"
              sizes="(max-width: 768px) 96vw, (max-width: 1200px) 48vw, min(380px, 36vw)"
              placeholder="empty"
            />
          </div>
        ) : isAtaraxiaCard || isAtrxCard ? (
          <div className="relative h-[min(46%,8.75rem)] w-[min(46%,9.5rem)] max-h-[58%] max-w-[62%] sm:h-[min(48%,9.25rem)] sm:w-[min(48%,10rem)]">
            <RevealImage
              src={image}
              alt={title}
              fill
              priority={imagePriority}
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
            priority={imagePriority}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, min(480px, 35vw)"
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
          />
        )}
    </>
  );

  const imageSection =
    href != null ? (
      <Link
        href={href}
        className="block w-full no-underline"
        aria-label={`Open ${title}`}
        data-portfolio-open
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        <div className={imageBoxClassName}>{imageBox}</div>
      </Link>
    ) : (
      <div className={imageBoxClassName}>{imageBox}</div>
    );

  const body = (
    <>
      {cascade ? (
        <CascadeIn step={cascade.baseStep}>{imageSection}</CascadeIn>
      ) : (
        imageSection
      )}

      <div
        className={`flex flex-col ${showSubtitle ? "gap-[clamp(4px,0.4vw,8px)]" : ""} ${cascadeClass}`}
        style={cascadeStep(1)}
      >
        <div className="mt-[clamp(4px,0.4vw,8px)] flex items-baseline justify-between gap-[clamp(10px,0.9vw,14px)]">
          <span className="truncate font-general font-medium text-[clamp(11px,0.833vw,14px)] leading-snug text-foreground">
            {title}
          </span>
          <span className="shrink-0 whitespace-nowrap font-quicksand font-medium text-[clamp(10px,0.677vw,12px)] text-foreground/65 tabular-nums">
            {date}
          </span>
        </div>
        {showSubtitle ? (
          <span className="font-quicksand font-medium text-[clamp(10px,0.677vw,12px)] tracking-wide text-foreground/75">
            {subtitle}
          </span>
        ) : null}
      </div>

      {description ? (
        <div className={cascadeClass} style={cascadeStep(2)}>
          <p className="m-0 line-clamp-2 font-quicksand font-medium text-[clamp(10px,0.677vw,12px)] leading-snug text-foreground/60">
            {description}
          </p>
        </div>
      ) : null}
    </>
  );

  return <div className={cardClassName}>{body}</div>;
}
