"use client";

import CascadeReveal from "@/components/CascadeReveal";
import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import HeroNav from "@/components/HeroNav";
import SocialIcon from "@/components/SocialIcon";
import HeroAttraction from "@/components/HeroAttraction";
import { HERO_CASCADE } from "@/lib/heroCascade";
import { Github, Linkedin, Mail, FileText } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { HeroNavHoverContext } from "@/components/HeroNavHoverContext";

export default function HeroShell({ children }: { children?: React.ReactNode }) {
  const [hoveredNavIndex, setHoveredNavIndex] = useState(-1);
  return (
    <HeroNavHoverContext.Provider
      value={{ hoveredIndex: hoveredNavIndex, setHoveredIndex: setHoveredNavIndex }}
    >
      <div className="flex min-h-screen flex-col lg:flex-row h-full">
        {/* Sidebar (Desktop) / Header Area (Mobile) */}
        <div className="flex flex-col lg:w-fit lg:h-screen lg:sticky lg:top-0 justify-between z-20">
          <div className="flex-1 flex flex-col border-x border-foreground/10 bg-foreground/2 px-[clamp(24px,4.635vw,89px)]">
            <header className="shrink-0 pt-[7vh] sm:pt-[10vh]">
              <div className="flex w-fit flex-col items-start">
                <div className="content-stretch flex flex-col sm:flex-row items-start sm:items-end justify-start gap-[clamp(18px,1.5vw,28px)] pointer-events-none">
                  <CascadeReveal step={HERO_CASCADE.cjk} className="shrink-0">
                    <CrossingCornerBorder
                      bleed="clamp(3px, 0.3125vw, 6px)"
                      thickness="clamp(1px, 0.052vw, 1.5px)"
                      className="bg-foreground content-stretch flex items-center justify-center p-[clamp(4px,0.416vw,8px)] shrink-0"
                    >
                      <div className="relative">
                        <div className="font-cjk font-bold leading-none text-[clamp(24px,2.2vw,42px)] text-foreground [-webkit-text-stroke:2px_var(--color-background)] whitespace-nowrap flex flex-col items-center">
                          <span className="mb-0">方</span>
                          <span className="mb-0">建</span>
                          <span>为</span>
                        </div>
                        <div className="absolute inset-0 font-cjk font-bold leading-none text-[clamp(24px,2.2vw,42px)] text-foreground whitespace-nowrap flex flex-col items-center">
                          <span className="mb-0">方</span>
                          <span className="mb-0">建</span>
                          <span>为</span>
                        </div>
                      </div>
                    </CrossingCornerBorder>
                  </CascadeReveal>

                  <CascadeReveal
                    step={HERO_CASCADE.title}
                    className="flex flex-col items-start relative shrink-0"
                  >
                    <h1 className="m-0 font-general font-medium leading-[normal] text-foreground text-[clamp(44px,6vw,116px)] tracking-[-0.08em] sm:-tracking-widest whitespace-nowrap text-left">
                      horst fang
                    </h1>
                    <div className="ml-[clamp(2px,0.26vw,5px)] font-quicksand font-light leading-[normal] text-foreground text-[clamp(14px,1.1vw,21px)] whitespace-nowrap">
                      syde @uwaterloo
                    </div>
                  </CascadeReveal>
                </div>

                <CascadeReveal step={HERO_CASCADE.nav} className="mt-[clamp(20px,2.6vh,32px)] w-full">
                  <HeroNav />
                </CascadeReveal>

                <CascadeReveal step={HERO_CASCADE.attraction} className="w-full mt-[clamp(28px,4.2vh,48px)]">
                  <HeroAttraction />
                </CascadeReveal>
              </div>
            </header>

            <div className="hidden lg:block pb-[5vh] mt-auto">
              <FooterContent />
            </div>
          </div>
        </div>

        <main className="flex-1 flex flex-col justify-start pt-[7vh] sm:pt-[10vh] px-[clamp(24px,4.635vw,89px)] pb-[clamp(32px,5vh,48px)] lg:pb-0 min-h-[50vh] lg:min-h-screen z-10">
          {children}
        </main>

        <div className="lg:hidden px-[clamp(24px,4.635vw,89px)] pb-[5vh] pt-[clamp(20px,3vh,28px)]">
          <FooterContent />
        </div>
      </div>
    </HeroNavHoverContext.Provider>
  );
}

const SOCIAL_ICONS = [
  {
    href: "https://github.com/HjwFang",
    label: "github",
    icon: <Github strokeWidth={1.2} className="size-[clamp(16px,1.1vw,20px)] text-background" />,
  },
  {
    href: "https://www.linkedin.com/in/horse-fang/",
    label: "linkedin",
    icon: <Linkedin strokeWidth={1.2} className="size-[clamp(16px,1.1vw,20px)] text-background" />,
  },
  {
    href: "https://x.com/horstfang",
    label: "x",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="size-[clamp(16px,1.1vw,20px)] text-background">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: "mailto:horstjw.fang@gmail.com",
    label: "email",
    isExternal: false,
    icon: <Mail strokeWidth={1.2} className="size-[clamp(16px,1.1vw,20px)] text-background" />,
  },
  {
    href: "/docs/horst-fang-resume.pdf",
    label: "resume",
    icon: <FileText strokeWidth={1.2} className="size-[clamp(16px,1.1vw,20px)] text-background" />,
  },
] as const;

const SOCIAL_TOOLTIP_OFFSET = 6;
const SOCIAL_TOOLTIP_FADE_MS = 200;

function FooterContent() {
  const [socialTooltip, setSocialTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleSocialHover = (label: string | null, e?: MouseEvent) => {
    if (!label || !e) {
      setTooltipVisible(false);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setSocialTooltip(null);
        hideTimeoutRef.current = null;
      }, SOCIAL_TOOLTIP_FADE_MS);
      return;
    }

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    setSocialTooltip({ label, x: e.clientX, y: e.clientY });
    requestAnimationFrame(() => setTooltipVisible(true));
  };

  return (
    <>
      <CascadeReveal step={HERO_CASCADE.footer} className="flex gap-[clamp(12px,1vw,16px)]">
        {SOCIAL_ICONS.map((item) => (
          <SocialIcon
            key={item.label}
            href={item.href}
            tooltip={item.label}
            isExternal={"isExternal" in item ? item.isExternal : true}
            icon={item.icon}
            onHover={handleSocialHover}
          />
        ))}
      </CascadeReveal>

      {socialTooltip && (
        <div
          className={`pointer-events-none fixed z-[9998] transition-opacity ease-out ${
            tooltipVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transitionDuration: `${SOCIAL_TOOLTIP_FADE_MS}ms`,
            left: socialTooltip.x + SOCIAL_TOOLTIP_OFFSET,
            top: socialTooltip.y,
            transform: `translateY(calc(-100% - ${SOCIAL_TOOLTIP_OFFSET}px))`,
          }}
          aria-hidden
        >
          <CrossingCornerBorder
            bleed="clamp(2px, 0.208vw, 4px)"
            thickness="clamp(1px, 0.052vw, 1px)"
            className="bg-[#502e2e] [--border-color:#dec7b0] px-[clamp(6px,0.5vw,8px)] py-[clamp(2px,0.15vw,3px)]"
          >
            <span className="font-general font-medium lowercase tracking-tight leading-none text-[clamp(11px,0.677vw,13px)] text-background whitespace-nowrap">
              {socialTooltip.label}
            </span>
          </CrossingCornerBorder>
        </div>
      )}
    </>
  );
}
