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
  /** Fires once the cascade class is applied (images settled or fallback). */
  onReady?: () => void;
};

/** Applies portfolio-cascade-in only after descendant images have loaded. */
export default function CascadeIn({ step, className, style, children, onReady }: CascadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let settled = false;
    const markReady = () => {
      if (settled) return;
      settled = true;
      setReady(true);
      onReadyRef.current?.();
    };
    const fallback = window.setTimeout(markReady, 900);
    const cleanup = waitForImages(el, () => {
      window.clearTimeout(fallback);
      markReady();
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
