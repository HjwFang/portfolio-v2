"use client";

import { createContext, Dispatch, SetStateAction, useContext } from "react";

export type HeroNavHoverContextValue = {
  hoveredIndex: number;
  setHoveredIndex: Dispatch<SetStateAction<number>>;
};

export const HeroNavHoverContext = createContext<HeroNavHoverContextValue | null>(null);

export function useHeroNavHoverContext() {
  return useContext(HeroNavHoverContext);
}

