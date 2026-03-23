import SectionContent from "@/components/SectionContent";
import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import Image from "next/image";
import Link from "next/link";

const PROJECTS = [
  {
    id: "ataraxia",
    title: "Ataraxia",
    date: "2025",
    description: "A streetwear brand combining bold aesthetics with inner calm.",
    image: "/atrx.png",
  },
  {
    id: "quickpos",
    title: "QuickPOS",
    date: "Ongoing",
    description: "Modern POS and restaurant workflows helping teams run smoother.",
    image: "/tsac.png",
  },
];

export default function ExperiencePage() {
  return (
    <div className="min-h-screen px-[5vw] lg:px-[89px]">
      <SectionContent aria-label="projects & experiences">
        <div className="flex items-center gap-3 mb-10">
          <span className="size-3 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="font-general font-medium text-foreground text-2xl lg:text-3xl tracking-tight m-0">
            projects & experiences
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-16 max-w-5xl">
          {PROJECTS.map((p) => (
            <div key={p.id} className="flex flex-col gap-4 max-w-[420px]">
              <Link 
                href={`/experience/${p.id}`} 
                className="group block transition-transform duration-300 hover:-translate-y-2"
              >
                <CrossingCornerBorder 
                  bleed="8px"
                  thickness="2px"
                  className="text-foreground"
                >
                  <div className="w-full overflow-hidden relative">
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
                  <h3 className="font-general font-semibold text-foreground text-xl lg:text-2xl tracking-tight m-0">
                    {p.title}
                  </h3>
                </Link>
                <span className="font-quicksand font-medium text-[#FF8A00] text-[clamp(10px,0.7vw,13px)] border border-[#FF8A00]/60 rounded-full px-3 py-0.5 tabular-nums">
                  {p.date}
                </span>
              </div>
              
              <p className="font-quicksand font-light text-foreground/80 text-base m-0 leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </SectionContent>
    </div>
  );
}
