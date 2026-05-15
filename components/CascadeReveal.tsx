"use client";

import type { CSSProperties, ReactNode } from "react";

type CascadeRevealProps = {
  step: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

function cascadeStyleFor(step: number, style?: CSSProperties): CSSProperties {
  return {
    ...style,
    ["--cascade-step" as string]: step,
  };
}

/** Text/layout beat — uses portfolio-cascade-in (no image wait). */
export default function CascadeReveal({ step, className, style, children }: CascadeRevealProps) {
  return (
    <div
      className={`${className ?? ""} portfolio-cascade-in`.trim()}
      style={cascadeStyleFor(step, style)}
    >
      {children}
    </div>
  );
}

type CascadeRevealHeadingProps = CascadeRevealProps;

export function CascadeRevealHeading({ step, className, style, children }: CascadeRevealHeadingProps) {
  return (
    <h2
      className={`${className ?? ""} portfolio-cascade-in`.trim()}
      style={cascadeStyleFor(step, style)}
    >
      {children}
    </h2>
  );
}
