import InteractiveBackground from "@/components/InteractiveBackground";

export default function Home() {
  return (
    <div className="relative size-full min-h-screen">
      <InteractiveBackground />
      <div className="absolute content-stretch flex items-end justify-between left-[5vw] bottom-[10vh] lg:left-[89px] lg:bottom-[89px] w-auto gap-8">


        <div className="bg-foreground content-stretch flex items-end p-[10px] relative shrink-0">
          <div className="relative">
            {/* Bottom outline layer: 2px stroke creates a 1px outer radius */}
            <div className="font-cjk font-bold leading-none text-[48px] text-foreground [-webkit-text-stroke:2px_var(--color-background)] whitespace-nowrap flex flex-col items-center">
              <span className="mb-0">方</span>
              <span className="mb-0">建</span>
              <span>为</span>
            </div>
            {/* Top fill layer: perfectly matching the container background to "erase" inner strokes */}
            <div className="absolute inset-0 font-cjk font-bold leading-none text-[48px] text-foreground whitespace-nowrap flex flex-col items-center">
              <span className="mb-0">方</span>
              <span className="mb-0">建</span>
              <span>为</span>
            </div>
          </div>
        </div>

        <div className="content-stretch flex flex-col items-start relative shrink-0">
          <div className="content-stretch flex items-center justify-center relative shrink-0">
            <h1 className="font-general font-medium leading-[normal] relative shrink-0 text-foreground text-[80px] lg:text-[128px] tracking-[-8px] lg:tracking-[-12.8px] whitespace-nowrap">
              horst fang
            </h1>
          </div>
          <div className="content-stretch flex items-center justify-center relative shrink-0">
            <p className="font-quicksand font-light leading-[normal] relative shrink-0 text-foreground text-[16px] lg:text-[24px] whitespace-nowrap">
              swe @QuickPOS, syde @uwaterloo
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
