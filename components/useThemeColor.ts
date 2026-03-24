"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || fallback;
}

export function useThemeForegroundLinearColor(): THREE.Color {
  const [cssValue, setCssValue] = useState<string>(() => readCssVar("--color-foreground", "#502e2e"));

  useEffect(() => {
    const update = () => setCssValue(readCssVar("--color-foreground", "#502e2e"));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Keep theme color in display space for this additive hologram pass.
  return useMemo(() => new THREE.Color(cssValue), [cssValue]);
}

