import SectionContent from "@/components/SectionContent";
import Image from "next/image";

const PROJECTS = [
  {
    id: "camcraft",
    title: "CamCraft",
    date: "Feb '26",
    description:
      "A virtual playground for exploring cameras and locations. Step into a 360-degree panoramic view of anywhere in the world. Navigate a scene using trained hand gestures and take photos rendered with camera-specific settings.",
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=400&fit=crop",
  },
  {
    id: "skema",
    title: "Skema",
    date: "Jan '26",
    description:
      "An npm package that transforms your localhost into an interactive whiteboard where you can draw new components and edit directly on your live website.",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=400&fit=crop",
  },
  {
    id: "dashboard",
    title: "Safety metrics dashboard",
    date: "Dec '25",
    description:
      "Real-time dashboard for reliability, storage, lighting, and climate metrics. Built for operations teams to monitor and act on safety-related KPIs.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
  },
  {
    id: "quickpos",
    title: "QuickPOS",
    date: "Ongoing",
    description:
      "Point-of-sale and restaurant workflows. Helping teams run smoother service and keep orders in sync from counter to kitchen.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop",
  },
];

export default function ExperiencePage() {
  return (
    <div className="min-h-screen bg-background px-[5vw] lg:px-[89px]">
      <SectionContent aria-label="Experiences and projects">
        <div className="flex items-center gap-3 mb-10">
          <span className="size-3 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="font-general font-medium text-foreground text-2xl lg:text-3xl tracking-tight m-0">
            projects
          </h2>
        </div>
        <ul className="list-none p-0 m-0 flex flex-col gap-12">
          {PROJECTS.map((p) => (
            <li key={p.id} className="flex flex-col gap-3">
              <div className="aspect-2/1 w-full max-w-2xl bg-foreground/10 overflow-hidden rounded-sm relative">
                <Image
                  src={p.image}
                  alt=""
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 90vw, 800px"
                />
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-general font-medium text-foreground text-xl lg:text-2xl tracking-tight m-0">
                  {p.title}
                </h3>
                <span className="font-quicksand font-light text-foreground text-sm border border-foreground/40 rounded-full px-3 py-1">
                  {p.date}
                </span>
              </div>
              <p className="font-quicksand font-light text-foreground/90 text-base lg:text-lg max-w-2xl m-0 leading-relaxed">
                {p.description}
              </p>
            </li>
          ))}
        </ul>
      </SectionContent>
    </div>
  );
}
