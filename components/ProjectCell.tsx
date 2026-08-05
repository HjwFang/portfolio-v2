import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import RevealImage from "@/components/RevealImage";
import Link from "next/link";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import {
  EXPERIENCE_ATARAXIA_IMAGE_SRC,
  EXPERIENCE_GREWAL_GUYATT_LOGO_SRC,
  EXPERIENCE_TSAC_LOGO_SRC,
  PROJECT_UNICOOK_LOGO_SRC,
  PROJECT_WATSAPP_IMAGE_SRC,
} from "@/lib/portfolioContent";

interface ProjectCellProps {
  title: string;
  timeline: string;
  tools: string;
  skills: string;
  overview: string;
  websiteUrl?: string;
  imageUrl?: string;
  linkText?: string;
}

export default function ProjectCell({
  title,
  timeline,
  tools,
  skills,
  overview,
  websiteUrl,
  imageUrl,
  linkText = "here",
}: ProjectCellProps) {
  const isAtaraxiaHero = imageUrl === EXPERIENCE_ATARAXIA_IMAGE_SRC;
  const isCompactHero =
    imageUrl === EXPERIENCE_TSAC_LOGO_SRC ||
    imageUrl === EXPERIENCE_GREWAL_GUYATT_LOGO_SRC ||
    imageUrl === PROJECT_WATSAPP_IMAGE_SRC ||
    imageUrl === PROJECT_UNICOOK_LOGO_SRC;
  const isUnicookHero = imageUrl === PROJECT_UNICOOK_LOGO_SRC;

  return (
    <div className="mb-[clamp(4rem,12vh,6rem)] flex flex-col gap-[clamp(1.75rem,4vw,2.5rem)] last:mb-0">
      {imageUrl && (
        <CrossingCornerBorder 
          bleed="clamp(4px,0.5vw,8px)"
          thickness="clamp(1px,0.1vw,1.5px)"
          className="text-foreground/20"
        >
          <div
            className={`relative w-full overflow-hidden group ${
              isAtaraxiaHero
                ? "flex aspect-4/2.5 items-center justify-center bg-[#FFFFFF]"
                : isCompactHero
                  ? "flex aspect-4/2.5 items-center justify-center bg-[#FFFFFF] p-[clamp(10px,2vw,28px)]"
                  : "bg-transparent"
            }`}
          >
            {isAtaraxiaHero ? (
              <div className="relative h-[min(42%,10rem)] w-[min(42%,11rem)] max-h-[54%] max-w-[58%] md:h-[min(44%,10.5rem)] md:w-[min(44%,11.5rem)]">
                <RevealImage
                  src={imageUrl}
                  alt={title || "Project Image"}
                  fill
                  className="object-contain object-center grayscale-[0.2] transition-[filter] duration-500 group-hover:grayscale-0"
                  sizes="(max-width: 768px) 58vw, min(280px, 36vw)"
                  priority
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                />
              </div>
            ) : isCompactHero ? (
              isUnicookHero ? (
                <RevealImage
                  src={imageUrl}
                  alt={title || "Project Image"}
                  width={97}
                  height={18}
                  className="h-[14px] w-auto max-w-[min(88vw,11rem)] object-contain object-center grayscale-[0.2] transition-[filter] duration-500 group-hover:grayscale-0 sm:h-[16px] md:h-[18px]"
                  sizes="(max-width: 768px) 160px, 200px"
                  priority
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                />
              ) : (
                <div className="relative h-[min(36%,9rem)] w-[min(28%,8rem)] max-h-[78%] max-w-[48%] md:h-[min(38%,10rem)] md:w-[min(30%,9rem)]">
                  <RevealImage
                    src={imageUrl}
                    alt={title || "Project Image"}
                    fill
                    className="object-contain object-center grayscale-[0.2] transition-[filter] duration-500 group-hover:grayscale-0"
                    sizes="(max-width: 768px) 50vw, min(360px, 40vw)"
                    priority
                    placeholder="blur"
                    blurDataURL={IMAGE_BLUR_DATA_URL}
                  />
                </div>
              )
            ) : (
              <RevealImage
                src={imageUrl}
                alt={title || "Project Image"}
                width={1600}
                height={900}
                wrapClassName="block w-full"
                className="block h-auto w-full grayscale-[0.2] transition-[filter] duration-500 group-hover:grayscale-0"
                sizes="94vw"
                priority
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
              />
            )}
          </div>
        </CrossingCornerBorder>
      )}

      <div className="flex flex-col gap-[clamp(1.5rem,3vw,2rem)]">
        <h2 className="m-0 font-general font-medium uppercase tracking-tight text-foreground text-[clamp(1.75rem,4.2vw,3rem)]">
          {title}
        </h2>

        <div className="grid grid-cols-1 gap-[clamp(1.25rem,2.5vw,2rem)] md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="font-quicksand font-light text-foreground/50 text-[clamp(0.6875rem,1vw,0.875rem)] uppercase tracking-widest">timeline</span>
            <span className="font-quicksand font-light text-foreground text-[clamp(0.9375rem,1.4vw,1.125rem)]">{timeline}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-quicksand font-light text-foreground/50 text-[clamp(0.6875rem,1vw,0.875rem)] uppercase tracking-widest">tools</span>
            <span className="font-quicksand font-light text-foreground text-[clamp(0.9375rem,1.4vw,1.125rem)]">{tools}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-quicksand font-light text-foreground/50 text-[clamp(0.6875rem,1vw,0.875rem)] uppercase tracking-widest">skills</span>
            <span className="font-quicksand font-light text-foreground text-[clamp(0.9375rem,1.4vw,1.125rem)]">{skills}</span>
          </div>
        </div>

        <hr className="border-foreground/10" />

        <div className="flex flex-col gap-[clamp(0.875rem,1.5vw,1rem)]">
          <h3 className="m-0 font-general font-medium tracking-tight text-foreground text-[clamp(1.25rem,2.5vw,1.875rem)]">Overview</h3>
          <p className="max-w-[92vw] font-quicksand font-light leading-[1.6] text-foreground/90 text-[clamp(0.9375rem,1.35vw,1.125rem)]">
            {overview}
          </p>
          {websiteUrl && (
            <div className="mt-2">
              <span className="font-quicksand font-light text-foreground text-[clamp(0.9375rem,1.35vw,1.125rem)]">
                View the website{" "}
                <Link 
                  href={websiteUrl} 
                  target="_blank" 
                  className="underline underline-offset-4 hover:text-foreground/70 transition-colors"
                >
                  {linkText}
                </Link>
                .
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
