import Image from "next/image";
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

  const body = (
    <>
      <div className="relative w-full aspect-4/2.5 overflow-hidden border border-foreground/10 bg-transparent transition-colors duration-200 group-hover:border-foreground/20">
        <Image
          src={image}
          alt={title}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 480px"
          placeholder="blur"
          blurDataURL={IMAGE_BLUR_DATA_URL}
        />
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
