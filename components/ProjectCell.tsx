import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import Image from "next/image";
import Link from "next/link";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";

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
  return (
    <div className="flex flex-col gap-10 mb-24 last:mb-0">
      {imageUrl && (
        <CrossingCornerBorder 
          bleed="6px"
          thickness="1.5px"
          className="text-foreground/20"
        >
          <div className="w-full overflow-hidden relative group bg-transparent">
            <Image
              src={imageUrl}
              alt={title || "Project Image"}
              width={1600}
              height={900}
              className="h-auto w-full block grayscale-[0.2] transition-[filter] duration-500 group-hover:grayscale-0"
              sizes="(max-width: 1280px) 100vw, 1200px"
              priority
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
            />
          </div>
        </CrossingCornerBorder>
      )}

      <div className="flex flex-col gap-8">
        <h2 className="font-general font-medium text-foreground text-4xl lg:text-5xl tracking-tight m-0 uppercase">
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-quicksand font-light text-foreground/50 text-sm uppercase tracking-widest">timeline</span>
            <span className="font-quicksand font-light text-foreground text-lg">{timeline}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-quicksand font-light text-foreground/50 text-sm uppercase tracking-widest">tools</span>
            <span className="font-quicksand font-light text-foreground text-lg">{tools}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-quicksand font-light text-foreground/50 text-sm uppercase tracking-widest">skills</span>
            <span className="font-quicksand font-light text-foreground text-lg">{skills}</span>
          </div>
        </div>

        <hr className="border-foreground/10" />

        <div className="flex flex-col gap-4">
          <h3 className="font-general font-medium text-foreground text-2xl lg:text-3xl tracking-tight m-0">Overview</h3>
          <p className="font-quicksand font-light text-foreground/90 text-base lg:text-lg leading-[1.6] max-w-4xl">
            {overview}
          </p>
          {websiteUrl && (
            <div className="mt-2">
              <span className="font-quicksand font-light text-foreground text-base lg:text-lg">
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
