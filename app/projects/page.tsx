import SectionContent from "@/components/SectionContent";
import PortfolioListCard from "@/components/PortfolioListCard";
import { PROJECT_GRID_ITEMS } from "@/lib/portfolioContent";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen px-[clamp(24px,4.635vw,89px)]">
      <SectionContent aria-label="projects">
        <div className="mb-10 flex items-center gap-3">
          <span className="size-2 shrink-0 rounded-full bg-foreground" aria-hidden />
          <h2 className="m-0 font-general text-2xl font-medium lowercase tracking-tight text-foreground lg:text-3xl">
            projects
          </h2>
        </div>

        <div className="grid max-w-[1200px] grid-cols-1 gap-x-16 gap-y-16 md:grid-cols-2">
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
