import SectionContent from "@/components/SectionContent";

export default function AboutPage() {
  return (
    <div className="min-h-screen px-[5vw] lg:px-[89px]">
      <SectionContent aria-label="About me">
        <div className="flex items-center gap-3 mb-10">
          <span className="size-3 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="font-general font-medium text-foreground text-2xl lg:text-3xl tracking-tight m-0">
            about me
          </h2>
        </div>
        <div className="max-w-2xl">
          <p className="font-quicksand font-light text-foreground/90 text-base lg:text-lg leading-relaxed mb-6">
            hi! i'm horst fang, a systems design engineering student at uwaterloo.
          </p>
          <p className="font-quicksand font-light text-foreground/90 text-base lg:text-lg leading-relaxed mb-6">
            on the technical side, i enjoy designing and building digital products. i care deeply about my craft and have a strong sense of detail and quality in the projects i work on.
          </p>
          <p className="font-quicksand font-light text-foreground/90 text-base lg:text-lg leading-relaxed mb-6">
            on the more personal side, i love sports, video games, hanging /w friends, and occasionally work on art pieces. (check some of my pieces/clips here!)
          </p>
        </div>
      </SectionContent>
    </div>
  );
}
