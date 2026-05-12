"use client";

import { useState } from "react";

import HeroShell from "@/components/HeroShell";
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

function ExperienceCard({ title, date, subtitle, description }: (typeof EXPERIENCES)[number]) {
  return (
    <div className="flex flex-col gap-1 group w-full">
      {/* Image placeholder */}
      <div className="w-full aspect-[4/2.5] bg-transparent border border-foreground/10 group-hover:border-foreground/20 transition-colors duration-200 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent flex items-center justify-center">
          <span className="font-general font-medium text-foreground/20 text-[clamp(9px,0.6vw,11px)] tracking-[0.2em] uppercase">
            {title.split(" ")[0]}
          </span>
        </div>
      </div>

      {/* Title row */}
      <div className="flex items-baseline justify-between gap-3 mt-1">
        <span className="font-general font-medium text-foreground text-[clamp(11px,0.833vw,14px)] leading-snug truncate">
          {title}
        </span>
        <span className="font-quicksand font-light text-foreground/65 text-[clamp(8px,0.5vw,10px)] whitespace-nowrap shrink-0 tabular-nums">
          {date}
        </span>
      </div>

      {/* Subtitle & description */}
      <div className="flex flex-col gap-1">
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

function GameCard({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3 group cursor-pointer">
      <div className="aspect-[3/4] bg-foreground/5 border border-foreground/10 group-hover:border-foreground/30 transition-colors duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <span className="font-general font-medium text-[clamp(12px,0.8vw,14px)] text-foreground group-hover:text-foreground/80 transition-colors duration-300">
        {title}
      </span>
    </div>
  );
}

function SectionRenderer() {
  const context = useHeroNavHoverContext();
  const index = context?.hoveredIndex ?? 0;
  const [miscTab, setMiscTab] = useState<"sports" | "arts" | "games">("arts");

  return (
    <div className="flex flex-col gap-4 w-full">
      {index === 0 && (
        <section>
          <h2 className="font-general font-medium text-[clamp(16px,1.8vw,28px)] tracking-tight mb-4 text-foreground">
            projects & experiences
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-12 max-w-4xl">
            {EXPERIENCES.map((exp) => (
              <ExperienceCard key={exp.id} {...exp} />
            ))}
          </div>
        </section>
      )}
      {index === 1 && (
        <section>
          <h2 className="font-general font-medium text-[clamp(16px,1.8vw,28px)] tracking-tight mb-4 text-foreground">
            about me
          </h2>
          <p className="font-quicksand font-light text-[clamp(13px,1vw,17px)] leading-snug text-foreground/70">
            Student at University of Waterloo. Passionate about building tools that feel as good as they look.
            Focused on systems, graphics, and full-stack development.
          </p>
        </section>
      )}
      {index === 2 && (
        <section>
          <div className="flex items-baseline gap-6 mb-6">
            <h2 className="font-general font-medium text-[clamp(16px,1.8vw,28px)] tracking-tight text-foreground">
              misc gallery
            </h2>
            <div className="flex items-center gap-4">
              {["arts", "games", "sports"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMiscTab(tab as any)}
                  className={`font-quicksand text-[clamp(12px,0.8vw,14px)] transition-all duration-300 relative ${
                    miscTab === tab ? "text-foreground font-medium" : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  {tab}
                  {miscTab === tab && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="transition-opacity duration-300">
            {miscTab === "arts" && (
              <div className="grid grid-cols-3 gap-2 auto-rows-[80px] max-w-2xl">
                <ArtPieceCard className="col-span-2 row-span-2" />
                <ArtPieceCard className="col-span-1 row-span-1" />
                <ArtPieceCard className="col-span-1 row-span-2" />
                <ArtPieceCard className="col-span-1 row-span-1" />
                <ArtPieceCard className="col-span-2 row-span-1" />
              </div>
            )}
            
            {miscTab === "games" && (
              <div className="grid grid-cols-3 gap-6 max-w-2xl">
                {[1, 2, 3].map((game) => (
                  <GameCard key={game} title={`Game Title ${game}`} />
                ))}
              </div>
            )}
            
            {miscTab === "sports" && (
              <div className="flex items-center justify-center h-40 max-w-2xl border border-dashed border-foreground/20">
                <span className="font-quicksand text-[clamp(12px,0.8vw,14px)] text-foreground/40">Not sure yet</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
