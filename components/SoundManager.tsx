"use client";

import { useEffect, useRef } from "react";

const OPEN_SOUND_SRC = "/sounds/freesound_community-menu-button-88360.mp3";
const OPEN_VOLUME = 0.5;

/**
 * Global "menu button" cue: plays whenever the user opens something marked with
 * `data-portfolio-open` (project/experience cards and the bottom-left social
 * icons). A single document-level listener keeps the behavior consistent across
 * every page.
 */
export default function SoundManager() {
  const openRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const open = new Audio(OPEN_SOUND_SRC);
    open.volume = OPEN_VOLUME;
    open.preload = "auto";
    openRef.current = open;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-portfolio-open]") == null) return;
      const audio = openRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      open.pause();
      openRef.current = null;
    };
  }, []);

  return null;
}
