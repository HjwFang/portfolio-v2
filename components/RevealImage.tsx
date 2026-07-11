"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type RevealImageProps = ImageProps & {
  /** Applied to the observer wrapper when `fill` is false (e.g. `block w-full` for full-width responsive images). */
  wrapClassName?: string;
};

function joinClasses(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export default function RevealImage({
  className,
  fill,
  priority,
  style,
  wrapClassName,
  onLoad,
  onLoadingComplete,
  ...rest
}: RevealImageProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const revealPlayedRef = useRef(!!priority);
  const [revealed, setRevealed] = useState(!!priority);
  const [loaded, setLoaded] = useState(false);

  const markLoaded = () => setLoaded(true);
  const src = rest.src;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const syncLoaded = () => {
      const img = root.querySelector("img");
      if (img?.complete && img.naturalWidth > 0) {
        setLoaded(true);
        return true;
      }
      return false;
    };

    if (syncLoaded()) return;

    setLoaded(false);
    const mo = new MutationObserver(() => {
      syncLoaded();
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [src]);

  useEffect(() => {
    if (priority) {
      setRevealed(true);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            obs.disconnect();
            return;
          }
        }
      },
      { rootMargin: "100px 0px 72px 0px", threshold: 0.01 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [priority]);

  let revealClass = "";
  if (!revealed && !priority) {
    revealClass = "portfolio-image-reveal--pending";
  } else if (!revealPlayedRef.current) {
    revealPlayedRef.current = true;
    if (!priority) revealClass = "portfolio-image-reveal--shown";
  }

  const imageClass = joinClasses(
    className,
    revealClass,
    "transition-opacity duration-300 ease-out",
    loaded ? "opacity-100" : "opacity-0 pointer-events-none",
  );

  const wrapClass = fill
    ? joinClasses("absolute inset-0 block min-h-0 min-w-0 overflow-hidden", wrapClassName)
    : joinClasses(
        "relative max-w-full min-w-0 overflow-hidden",
        wrapClassName ?? "inline-block",
      );

  const imageStyle = fill
    ? { backgroundColor: "transparent", ...style }
    : style;

  return (
    <span ref={rootRef} className={wrapClass}>
      <Image
        {...rest}
        fill={fill}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className={imageClass}
        style={imageStyle}
        onLoad={(e) => {
          markLoaded();
          onLoad?.(e);
        }}
        onLoadingComplete={(img) => {
          markLoaded();
          onLoadingComplete?.(img);
        }}
      />
    </span>
  );
}
