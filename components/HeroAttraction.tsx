import CrossingCornerBorder from "@/components/CrossingCornerBorder";

export default function HeroAttraction() {
    return (
        <div className="w-full flex items-center justify-center">
            <CrossingCornerBorder
                bleed="clamp(3px, 0.3125vw, 6px)"
                thickness="clamp(1px, 0.052vw, 1.5px)"
                className="w-full lg:w-[100%] lg:h-[70vh] aspect-[4/3] lg:aspect-auto"
            >
                <div className="w-full h-full bg-foreground/[0.03] flex items-center justify-center relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-foreground/[0.05] to-transparent opacity-50" />
                    
                    {/* Inner Content Placeholder */}
                    <div className="relative flex flex-col items-center gap-4">
                        <div className="size-12 lg:size-16 rounded-full border border-foreground/10 flex items-center justify-center animate-pulse">
                            <div className="size-2 lg:size-3 rounded-full bg-foreground/20" />
                        </div>
                        <span className="font-quicksand font-light text-foreground/30 text-[clamp(12px,0.8vw,14px)] uppercase tracking-[0.2em]">
                            featured attraction
                        </span>
                    </div>
                </div>
            </CrossingCornerBorder>
        </div>
    );
}
