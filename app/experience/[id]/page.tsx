import SectionContent from "@/components/SectionContent";
import ProjectCell from "@/components/ProjectCell";
import { notFound } from "next/navigation";

const PROJECT_DETAILS: Record<string, any> = {
  quickpos: {
    title: "Quickpos Technologies",
    timeline: "jan 2026 - apr 2026",
    tools: "next.js, typescript, rag, supabase",
    skills: "rag b2b saas, web_dev, product_design",
    overview: "At Quickpos, I worked on integrating RAG (Retrieval-Augmented Generation) into B2B SaaS applications, enhancing the capabilities of their point-of-sale systems and internal tools.",
    websiteUrl: "#",
    imageUrl: "/atrx.png",
  },
  ataraxia: {
    title: "Ataraxia Apparel",
    timeline: "may 2025 - sep 2025",
    tools: "figma, illustrator, shopify",
    skills: "founder, ui/ux design, product_design",
    overview: "Ataraxia is a streetwear brand I founded to support young adults transitioning into new stages of life. The brand combines bold streetwear aesthetics with subtle reminders to maintain inner calm.",
    websiteUrl: "#",
    imageUrl: "/ataraxia-brand.png",
  },
  peths: {
    title: "PETHS Student Council",
    timeline: "may 2024 - jun 2025",
    tools: "social media, leadership, marketing",
    skills: "publicity, community_engagement, branding",
    overview: "As Head of Publicity, I managed the student council's public image and social media presence, driving engagement and communication for the entire student body.",
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
