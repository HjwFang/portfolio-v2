"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

function imageIsReady(img: HTMLImageElement) {
  return img.complete && img.naturalWidth > 0;
}

function waitForImages(container: HTMLElement, onReady: () => void) {
  let cancelled = false;

  const check = () => {
    if (cancelled) return;
    const imgs = [...container.querySelectorAll("img")];
    // Wait until Next/Image mounts <img> — never treat "no images yet" as ready.
    if (imgs.length === 0) return;
    if (imgs.every(imageIsReady)) {
      onReady();
      return;
    }
    for (const img of imgs) {
      if (!imageIsReady(img)) {
        img.addEventListener("load", check, { once: true });
        img.addEventListener("error", check, { once: true });
      }
    }
  };

  check();
  const mo = new MutationObserver(check);
  mo.observe(container, { childList: true, subtree: true });

  return () => {
    cancelled = true;
    mo.disconnect();
  };
}

type CascadeInProps = {
  step: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/** Applies portfolio-cascade-in only after descendant images have loaded. */
export default function CascadeIn({ step, className, style, children }: CascadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return waitForImages(el, () => setReady(true));
  }, []);

  const cascadeStyle: CSSProperties = {
    ...style,
    ["--cascade-step" as string]: step,
  };

  return (
    <div
      ref={ref}
      className={`${className ?? ""} ${ready ? "portfolio-cascade-in" : "invisible"}`}
      style={cascadeStyle}
    >
      {children}
    </div>
  );
}
