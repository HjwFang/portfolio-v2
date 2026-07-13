import SectionContent from "@/components/SectionContent";
import ProjectCell from "@/components/ProjectCell";
import { EXPERIENCE_DETAILS } from "@/lib/portfolioContent";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return Object.keys(EXPERIENCE_DETAILS).map((id) => ({ id }));
}

export default function ExperienceDetailPage({ params }: { params: { id: string } }) {
  const experience = EXPERIENCE_DETAILS[params.id];

  if (!experience) {
    notFound();
  }

  return (
    <div className="min-h-screen px-[clamp(24px,4.635vw,89px)]">
      <SectionContent
        aria-label={experience.title}
        backHref="/?section=experiences"
        backLabel="Back to experiences"
      >
        <ProjectCell
          title={experience.title}
          timeline={experience.timeline}
          tools={experience.tools}
          skills={experience.skills}
          overview={experience.overview}
          websiteUrl={experience.websiteUrl !== "#" ? experience.websiteUrl : undefined}
          imageUrl={experience.imageUrl}
        />
      </SectionContent>
    </div>
  );
}
