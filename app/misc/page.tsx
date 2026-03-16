import SectionContent from "@/components/SectionContent";

export default function MiscPage() {
  return (
    <div className="min-h-screen bg-background px-[5vw] lg:px-[89px]">
      <SectionContent aria-label="Miscellaneous">
        <div className="flex items-center gap-3 mb-10">
          <span className="size-3 rounded-full bg-foreground shrink-0" aria-hidden />
          <h2 className="font-general font-medium text-foreground text-2xl lg:text-3xl tracking-tight m-0">
            misc
          </h2>
        </div>
        <p className="font-quicksand font-light text-foreground/60 text-base max-w-xl m-0">
          Nothing here yet.
        </p>
      </SectionContent>
    </div>
  );
}
