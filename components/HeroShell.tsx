import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import HeroNav from "@/components/HeroNav";
import InteractiveBackground from "@/components/InteractiveBackground";
import SocialIcon from "@/components/SocialIcon";
import { Github, Linkedin, Mail, FileText } from "lucide-react";

export default function HeroShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative size-full min-h-screen overflow-hidden">
      <InteractiveBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="shrink-0 px-[5vw] pt-[15vh] lg:px-[89px]">
          <div className="flex w-max flex-col items-start gap-10">
            <div className="content-stretch flex items-end justify-between gap-6 pointer-events-none">
              <CrossingCornerBorder className="bg-foreground content-stretch flex items-center justify-center p-[8px] shrink-0">
                <div className="relative">
                  <div className="font-cjk font-bold leading-none text-[40px] text-foreground [-webkit-text-stroke:2px_var(--color-background)] whitespace-nowrap flex flex-col items-center">
                    <span className="mb-0">方</span>
                    <span className="mb-0">建</span>
                    <span>为</span>
                  </div>
                  <div className="absolute inset-0 font-cjk font-bold leading-none text-[40px] text-foreground whitespace-nowrap flex flex-col items-center">
                    <span className="mb-0">方</span>
                    <span className="mb-0">建</span>
                    <span>为</span>
                  </div>
                </div>
              </CrossingCornerBorder>

              <div className="flex flex-col items-start relative shrink-0">
                <h1 className="m-0 font-general font-medium leading-[normal] text-foreground text-[72px] lg:text-[112px] tracking-[-7px] lg:tracking-[-11px] whitespace-nowrap text-left">
                  horst fang
                </h1>
                <div className="ml-[5px] font-quicksand font-light leading-[normal] text-foreground text-[14px] lg:text-[20px] whitespace-nowrap">
                  swe @QuickPOS, syde @uwaterloo
                </div>
              </div>
            </div>

            <HeroNav />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-[5vw] lg:px-[89px]">
          {children}
        </main>

        <footer className="shrink-0 px-[5vw] pb-[5vh] pt-6 lg:px-[89px]">
          <div className="flex flex-col gap-3">
            <span className="font-quicksand font-light text-foreground text-m tracking-wider">
              connect with me!
            </span>
            <div className="flex gap-4">
              <SocialIcon
                href="https://github.com/HjwFang"
                icon={<Github strokeWidth={1.25} className="size-5 xl:size-6 text-background" />}
              />
              <SocialIcon
                href="https://www.linkedin.com/in/horst-fang/"
                icon={<Linkedin strokeWidth={1.25} className="size-5 xl:size-6 text-background" />}
              />
              <SocialIcon
                href="https://x.com/horstfang"
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="size-4 xl:size-5 text-background">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                }
              />
              <SocialIcon
                href="mailto:horstjw.fang@gmail.com"
                isExternal={false}
                icon={<Mail strokeWidth={1.25} className="size-5 xl:size-6 text-background" />}
              />
              <SocialIcon
                href="#"
                disabled={true}
                tooltip="Resume not yet available"
                icon={<FileText strokeWidth={1.25} className="size-5 xl:size-6 text-background" />}
              />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
