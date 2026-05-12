import SectionContent from "@/components/SectionContent";
import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import Image from "next/image";
import Link from "next/link";

const PROJECTS = [
  {
    id: "quickpos",
    title: "Quickpos Technologies",
    date: "2026",
    description: "Building RAG B2B SaaS solutions and streamlining POS systems.",
    image: "/atrx.png", // Using available asset as placeholder
  },
  {
    id: "ataraxia",
    title: "Ataraxia Apparel",
    date: "2025",
    description: "A streetwear brand combining bold aesthetics with inner calm.",
    image: "/ataraxia-brand.png",
  },
  {
    id: "trudeau-sac",
    title: "Trudeau Student Activities Council",
    date: "2024 – 2025",
    description: "Leading publicity and digital presence for the student community.",
    image: "/tsac.png",
  },
];

export default function ExperiencePage() {
  return (
    <div className="min-h-screen px-[clamp(24px,4.635vw,89px)]">
      <SectionContent aria-label="projects & experiences">
        <div className="flex items-center gap-3 mb-10">
          <span className="size-2 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="font-general font-medium text-foreground text-2xl lg:text-3xl tracking-tight m-0">
            projects & experiences
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-16 max-w-[1200px]">
          {PROJECTS.map((p) => (
            <div key={p.id} className="flex flex-col gap-4 max-w-[320px]">
              <Link 
                href={`/experience/${p.id}`} 
                className="group block transition-transform duration-300 hover:-translate-y-2"
              >
                <CrossingCornerBorder 
                  bleed="6px"
                  thickness="1.5px"
                  className="text-foreground/20 group-hover:text-foreground/40 transition-colors"
                >
                  <div className="w-full overflow-hidden relative grayscale-[0.5] group-hover:grayscale-0 transition-[filter]">
                    <Image
                      src={p.image}
                      alt={p.title}
                      width={1600}
                      height={900}
                      className="w-full h-auto block"
                      priority
                    />
                  </div>
                </CrossingCornerBorder>
              </Link>
              
              <div className="flex items-center justify-between gap-3 mt-1">
                <Link href={`/experience/${p.id}`} className="hover:underline underline-offset-4 decoration-current transition-all">
                  <h3
                    className={`font-general font-medium text-foreground text-lg lg:text-xl tracking-tight m-0`}
                  >
                    {p.title}
                  </h3>
                </Link>
                <span className="font-quicksand font-medium text-foreground/70 text-[clamp(10px,0.7vw,12px)] border border-foreground/15 rounded-full px-3 py-0.5 tabular-nums">
                  {p.date}
                </span>
              </div>
              
              <p className="font-quicksand font-light text-foreground/65 text-sm m-0 leading-relaxed max-w-[90%]">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </SectionContent>
    </div>
  );
}
