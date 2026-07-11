"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

function imageIsSettled(img: HTMLImageElement) {
  return img.complete;
}

function waitForImages(container: HTMLElement, onReady: () => void) {
  let cancelled = false;
  let emptyFallback: number | undefined;

  const check = () => {
    if (cancelled) return;
    const imgs = [...container.querySelectorAll("img")];
    if (imgs.length === 0) {
      emptyFallback ??= window.setTimeout(() => {
        if (!cancelled) onReady();
      }, 280);
      return;
    }
    window.clearTimeout(emptyFallback);
    emptyFallback = undefined;
    if (imgs.every(imageIsSettled)) {
      onReady();
      return;
    }
    for (const img of imgs) {
      if (!imageIsSettled(img)) {
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
    window.clearTimeout(emptyFallback);
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
    const fallback = window.setTimeout(() => setReady(true), 900);
    const cleanup = waitForImages(el, () => {
      window.clearTimeout(fallback);
      setReady(true);
    });
    return () => {
      window.clearTimeout(fallback);
      cleanup();
    };
  }, []);

  const cascadeStyle: CSSProperties = {
    ...style,
    ["--cascade-step" as string]: step,
  };

  return (
    <div
      ref={ref}
      className={`${className ?? ""} ${ready ? "portfolio-cascade-in" : "opacity-0"}`}
      style={cascadeStyle}
    >
      {children}
    </div>
  );
}
