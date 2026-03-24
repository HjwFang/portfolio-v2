"use client";

import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import HeroNav from "@/components/HeroNav";
import SocialIcon from "@/components/SocialIcon";
import { Github, Linkedin, Mail, FileText } from "lucide-react";
import { useState } from "react";
import { HeroNavHoverContext } from "@/components/HeroNavHoverContext";

export default function HeroShell({ children }: { children?: React.ReactNode }) {
  const [hoveredNavIndex, setHoveredNavIndex] = useState(-1);
  return (
    <HeroNavHoverContext.Provider
      value={{ hoveredIndex: hoveredNavIndex, setHoveredIndex: setHoveredNavIndex }}
    >
      <div className="flex min-h-screen flex-col lg:flex-row h-full">
        {/* Sidebar (Desktop) / Header Area (Mobile) */}
        <div className="flex flex-col lg:w-[40%] lg:h-screen lg:sticky lg:top-0 justify-between z-20">
          <header className="shrink-0 px-[clamp(24px,4.635vw,89px)] pt-[10vh] sm:pt-[15vh]">
            <div className="flex w-full sm:w-max flex-col items-start gap-8 sm:gap-10">
              <div className="content-stretch flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pointer-events-none">
                <CrossingCornerBorder
                  bleed="clamp(3px, 0.3125vw, 6px)"
                  thickness="clamp(1px, 0.052vw, 1.5px)"
                  className="bg-foreground content-stretch flex items-center justify-center p-[clamp(4px,0.416vw,8px)] shrink-0"
                >
                  <div className="relative">
                    <div className="font-cjk font-bold leading-none text-[clamp(28px,2.5vw,48px)] text-foreground [-webkit-text-stroke:2px_var(--color-background)] whitespace-nowrap flex flex-col items-center">
                      <span className="mb-0">方</span>
                      <span className="mb-0">建</span>
                      <span>为</span>
                    </div>
                    <div className="absolute inset-0 font-cjk font-bold leading-none text-[clamp(28px,2.5vw,48px)] text-foreground whitespace-nowrap flex flex-col items-center">
                      <span className="mb-0">方</span>
                      <span className="mb-0">建</span>
                      <span>为</span>
                    </div>
                  </div>
                </CrossingCornerBorder>

                <div className="flex flex-col items-start relative shrink-0">
                  <h1 className="m-0 font-general font-medium leading-[normal] text-foreground text-[clamp(48px,6.666vw,128px)] tracking-[-0.08em] sm:tracking-[-0.1em] whitespace-nowrap text-left">
                    horst fang
                  </h1>
                  <div className="ml-[2px] sm:ml-[5px] font-quicksand font-light leading-[normal] text-foreground text-[clamp(12px,1.25vw,24px)] whitespace-nowrap">
                    swe @QuickPOS, syde @uwaterloo
                  </div>
                </div>
              </div>

              <HeroNav />
            </div>
          </header>

          {/* Footer Content for Desktop: Stays at the bottom of the left column */}
          <div className="hidden lg:block px-[clamp(24px,4.635vw,89px)] pb-[5vh] mt-auto">
            <FooterContent />
          </div>
        </div>

        {/* Hero Attraction / Main Content Area */}
        <main className="flex-1 flex flex-col justify-center px-[clamp(24px,4.635vw,89px)] py-10 lg:py-0 min-h-[50vh] lg:min-h-screen z-10">
          {children}
        </main>

        {/* Footer Content for Mobile: Appears at the bottom of the page */}
        <div className="lg:hidden px-[clamp(24px,4.635vw,89px)] pb-[5vh] pt-6">
          <FooterContent />
        </div>
      </div>
    </HeroNavHoverContext.Provider>
  );
}

function FooterContent() {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-quicksand font-light text-foreground text-m tracking-wider">
        connect with me!
      </span>
      <div className="flex gap-4">
        <SocialIcon
          href="https://github.com/HjwFang"
          icon={<Github strokeWidth={1.2} className="size-[clamp(18px,1.666vw,32px)] text-background" />}
        />
        <SocialIcon
          href="https://www.linkedin.com/in/horst-fang/"
          icon={<Linkedin strokeWidth={1.2} className="size-[clamp(18px,1.666vw,32px)] text-background" />}
        />
        <SocialIcon
          href="https://x.com/horstfang"
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="size-[clamp(16px,1.4vw,28px)] text-background">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          }
        />
        <SocialIcon
          href="mailto:horstjw.fang@gmail.com"
          isExternal={false}
          icon={<Mail strokeWidth={1.2} className="size-[clamp(18px,1.666vw,32px)] text-background" />}
        />
        <SocialIcon
          href="#"
          disabled={true}
          tooltip="Resume not yet available"
          icon={<FileText strokeWidth={1.2} className="size-[clamp(18px,1.666vw,32px)] text-background" />}
        />
      </div>
    </div>
  );
}

