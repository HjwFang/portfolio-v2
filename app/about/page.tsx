import SectionContent from "@/components/SectionContent";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background px-[5vw] lg:px-[89px]">
      <SectionContent aria-label="About me">
        <div className="flex items-center gap-3 mb-10">
          <span className="size-3 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="font-general font-medium text-foreground text-2xl lg:text-3xl tracking-tight m-0">
            about me
          </h2>
        </div>
        <div className="max-w-2xl space-y-4">
          <p className="font-quicksand font-light text-foreground/90 text-base lg:text-lg leading-relaxed m-0">
            I'm Horst — SWE at QuickPOS and a Systems Design Engineering grad from Waterloo. I like
            building things that feel right: clear UIs, solid APIs, and tools that actually help.
          </p>
          <p className="font-quicksand font-light text-foreground/90 text-base lg:text-lg leading-relaxed m-0">
            When I'm not coding I'm usually reading, drawing, or outdoors. This site is where I keep
            projects and the occasional thought; more to come.
          </p>
        </div>
      </SectionContent>
    </div>
  );
}
