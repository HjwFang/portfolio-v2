export const HOME_SECTIONS = ["experiences", "projects", "misc"] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

export const MISC_TABS = ["art", "games", "sports"] as const;
export type MiscTab = (typeof MISC_TABS)[number];

export function sectionSlugToIndex(slug: string | null | undefined): number {
  if (!slug) return 0;
  const idx = HOME_SECTIONS.indexOf(slug as HomeSection);
  return idx >= 0 ? idx : 0;
}

export function indexToSectionSlug(index: number): HomeSection {
  return HOME_SECTIONS[Math.max(0, Math.min(index, HOME_SECTIONS.length - 1))];
}

export function parseMiscTab(slug: string | null | undefined): MiscTab {
  if (!slug) return "art";
  return MISC_TABS.includes(slug as MiscTab) ? (slug as MiscTab) : "art";
}

export function readHomeNavigationFromUrl(url: URL | Location = window.location) {
  const params = new URLSearchParams(url.search);
  return {
    sectionIndex: sectionSlugToIndex(params.get("section")),
    miscTab: parseMiscTab(params.get("tab")),
  };
}

function replaceUrlIfChanged(url: URL) {
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(null, "", next);
  }
}

export function writeSectionToUrl(sectionIndex: number, url: URL = new URL(window.location.href)) {
  if (sectionIndex <= 0) {
    url.searchParams.delete("section");
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("section", indexToSectionSlug(sectionIndex));
    if (sectionIndex !== 2) {
      url.searchParams.delete("tab");
    }
  }

  replaceUrlIfChanged(url);
}

export function writeMiscTabToUrl(miscTab: MiscTab, url: URL = new URL(window.location.href)) {
  url.searchParams.set("section", "misc");
  if (miscTab === "art") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", miscTab);
  }

  replaceUrlIfChanged(url);
}
