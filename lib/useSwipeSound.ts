import { useCallback, useEffect, useRef } from "react";

const SWIPE_SOUND_SRC = "/sounds/driken5482-swipe-236674.mp3";
const DEFAULT_VOLUME = 0.4;

/**
 * Shared "swipe" cue for selection changes (nav, indexed selectors, carousels).
 * Lazily creates a single reused Audio element and returns a `play()` that
 * restarts the clip from the beginning each time.
 */
export function useSwipeSound(volume: number = DEFAULT_VOLUME) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(SWIPE_SOUND_SRC);
    audio.volume = volume;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [volume]);

  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);
}
