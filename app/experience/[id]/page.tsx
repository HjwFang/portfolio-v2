import SectionContent from "@/components/SectionContent";
import ProjectCell from "@/components/ProjectCell";
import { notFound } from "next/navigation";

const PROJECT_DETAILS: Record<string, any> = {
  ataraxia: {
    title: "Ataraxia",
    timeline: "may 2025 - present",
    tools: "figma, illustrator, capcut",
    skills: "ui/ux design, product_design, user_research",
    overview: "Ataraxia is a streetwear brand I founded to support young adults transitioning into new stages of life. The brand combines bold streetwear aesthetics with subtle reminders to maintain inner calm.",
    websiteUrl: "#",
    imageUrl: "/atrx.png",
  },
  quickpos: {
    title: "QuickPOS",
    timeline: "jan 2024 - ongoing",
    tools: "next.js, supabase, prisma, stripe",
    skills: "fullstack development, systems design, payments integration",
    overview: "A comprehensive point-of-sale system tailored for modern restaurant workflows. It features real-time order synchronization between counter and kitchen, integrated payments through Stripe, and a robust backend built with Supabase and Prisma. Designed to help teams run smoother services and manage complex workflows with ease.",
    websiteUrl: "#",
    imageUrl: "/tsac.png",
  },
};

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = PROJECT_DETAILS[params.id];

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen px-[5vw] lg:px-[89px]">
      <SectionContent 
        aria-label={project.title}
        backHref="/experience"
        backLabel="Back to projects"
      >
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
