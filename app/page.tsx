import InteractiveBackground from "@/components/InteractiveBackground";
import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import SocialIcon from "@/components/SocialIcon";
import { Github, Linkedin, Mail, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="relative size-full min-h-screen overflow-hidden">
      <InteractiveBackground />
      <div className="absolute left-[5vw] top-[15vh] lg:left-[89px] lg:top-[15vh] flex flex-col z-10 pointer-events-none">
        <div className="content-stretch flex items-end justify-between w-auto gap-8">

          <CrossingCornerBorder className="bg-foreground content-stretch flex items-end p-[10px] shrink-0">
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
          </CrossingCornerBorder>

          <div className="flex flex-col items-start relative shrink-0">
            <h1 className="m-0 font-general font-medium leading-[normal] text-foreground text-[80px] lg:text-[128px] tracking-[-8px] lg:tracking-[-12.8px] whitespace-nowrap text-left">
              horst fang
            </h1>
            <div className="ml-[6px] font-quicksand font-light leading-[normal] text-foreground text-[16px] lg:text-[24px] whitespace-nowrap">
              swe @QuickPOS, syde @uwaterloo
            </div>
          </div>

        </div>
        <p className="mt-24 font-quicksand font-light leading-[normal] text-foreground text-[14px] lg:text-[16px] max-w-xl">
          designer &amp; developer passionate about building cool things!
        </p>
      </div>

      <div className="absolute left-[5vw] bottom-[5vh] lg:left-[89px] lg:bottom-[5vh] flex gap-4 z-10 pointer-events-auto">
        <SocialIcon
          href="https://github.com/HjwFang"
          icon={<Github strokeWidth={1.25} className="size-5 xl:size-6 text-[#fffeee]" />}
        />
        <SocialIcon
          href="https://www.linkedin.com/in/horst-fang/"
          icon={<Linkedin strokeWidth={1.25} className="size-5 xl:size-6 text-[#fffeee]" />}
        />
        <SocialIcon
          href="https://x.com/horstfang"
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="size-4 xl:size-5 text-[#fffeee]">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          }
        />
        <SocialIcon
          href="mailto:horstjw.fang@gmail.com"
          isExternal={false}
          icon={<Mail strokeWidth={1.25} className="size-5 xl:size-6 text-[#fffeee]" />}
        />
        <SocialIcon
          href="#"
          disabled={true}
          tooltip="Resume not yet available"
          icon={<FileText strokeWidth={1.25} className="size-5 xl:size-6 text-[#fffeee]" />}
        />
      </div>
    </div >
  );
}
