import SectionContent from "@/components/SectionContent";
import ProjectCell from "@/components/ProjectCell";
import { PROJECT_DETAILS } from "@/lib/portfolioContent";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return Object.keys(PROJECT_DETAILS).map((id) => ({ id }));
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = PROJECT_DETAILS[params.id];

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen px-[clamp(24px,4.635vw,89px)]">
      <SectionContent aria-label={project.title} backHref="/projects" backLabel="Back to projects">
        <ProjectCell
          title={project.title}
          timeline={project.timeline}
          tools={project.tools}
          skills={project.skills}
          overview={project.overview}
          websiteUrl={project.websiteUrl}
          imageUrl={project.imageUrl}
        />
      </SectionContent>
    </div>
  );
}
