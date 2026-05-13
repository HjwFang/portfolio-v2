import SectionContent from "@/components/SectionContent";
import PortfolioListCard from "@/components/PortfolioListCard";
import { PROJECT_GRID_ITEMS } from "@/lib/portfolioContent";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen px-[clamp(24px,4.635vw,89px)]">
      <SectionContent aria-label="projects">
        <div className="mb-[clamp(1.75rem,4vh,2.5rem)] flex items-center gap-3">
          <span className="size-2 shrink-0 rounded-full bg-foreground" aria-hidden />
          <h2 className="m-0 font-general font-medium lowercase tracking-tight text-foreground text-[clamp(1.25rem,2.4vw,1.875rem)]">
            projects
          </h2>
        </div>

        <div className="grid w-full max-w-[94vw] grid-cols-1 gap-x-[clamp(2rem,5vw,4rem)] gap-y-[clamp(2rem,5vw,4rem)] md:grid-cols-2">
          {PROJECT_GRID_ITEMS.map((item, i) => (
            <PortfolioListCard
              key={item.id}
              item={item}
              href={`/projects/${item.id}`}
              priority={i === 0}
              showSubtitle={false}
            />
          ))}
        </div>
      </SectionContent>
    </div>
  );
}
