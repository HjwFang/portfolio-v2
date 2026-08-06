import SectionContent from "@/components/SectionContent";

export default function AboutPage() {
  return (
    <div className="min-h-screen px-[clamp(24px,4.635vw,89px)]">
      <SectionContent aria-label="About me">
        <div className="mb-[clamp(1.75rem,4vh,2.5rem)] flex items-center gap-3">
          <span className="size-3 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="m-0 font-general font-medium tracking-tight text-foreground text-[clamp(1.25rem,2.4vw,1.875rem)]">
            about me
          </h2>
        </div>
        <div className="max-w-[90vw]">
          <p className="mb-6 font-quicksand font-light leading-relaxed text-foreground/90 text-[clamp(0.9375rem,1.35vw,1.125rem)]">
            hi! i&apos;m horst fang, a systems design engineering student at uwaterloo.
          </p>
          <p className="mb-6 font-quicksand font-light leading-relaxed text-foreground/90 text-[clamp(0.9375rem,1.35vw,1.125rem)]">
            on the technical side, i enjoy designing and building digital products. i care deeply about my craft and have a strong sense of detail and quality in the projects i work on.
          </p>
          <p className="mb-6 font-quicksand font-light leading-relaxed text-foreground/90 text-[clamp(0.9375rem,1.35vw,1.125rem)]">
            on the more personal side, i love sports, video games, hanging /w friends, and occasionally work on art pieces. (check some of my pieces/clips here!)
          </p>
        </div>
      </SectionContent>
    </div>
  );
}
