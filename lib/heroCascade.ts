/** Stagger indices for the hero intro cascade (top-left → bottom-right). */
export const HERO_CASCADE = {
  cjk: 0,
  title: 1,
  nav: 2,
  attraction: 3,
  footer: 4,
  /** First step used by the main content column (heading, then cards). */
  main: 5,
} as const;

/** Portfolio cards use three beats each; offset from hero steps. */
export function portfolioCardCascadeStep(cardIndex: number) {
  return HERO_CASCADE.main + 1 + cardIndex * 3;
}
