"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

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
  ...rest
}: RevealImageProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(!!priority);

  useEffect(() => {
    if (priority) return;

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

  const revealClass = priority
    ? ""
    : revealed
      ? "portfolio-image-reveal--shown"
      : "portfolio-image-reveal--pending";

  const imageClass = joinClasses(className, revealClass);

  const wrapClass = fill
    ? joinClasses("absolute inset-0 block min-h-0 min-w-0 overflow-hidden", wrapClassName)
    : joinClasses(
        "relative max-w-full min-w-0 overflow-hidden",
        wrapClassName ?? "inline-block",
      );

  return (
    <span ref={rootRef} className={wrapClass}>
      <Image
        {...rest}
        fill={fill}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className={imageClass}
        style={style}
      />
    </span>
  );
}
