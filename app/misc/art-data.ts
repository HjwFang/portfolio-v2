/**
 * Catalog of art pieces shown on /misc.
 *
 * Each entry references a JPEG in /public/art/cleaned/ (full size) and
 * /public/art/cleaned/thumb/ (small grid preview). Width/height are the
 * post-clean intrinsic dimensions so the gallery can render aspect-ratio
 * accurate tiles without measuring at runtime.
 *
 * Optional fields:
 *  - year:   the year the piece was made (used for grouping). Leave undefined
 *            if unknown so the piece falls into the "undated" bucket.
 *  - section: optional subsection title within a year (e.g. several stripes under 2021).
 *  - title:  short human label, otherwise the alt text falls back to "untitled".
 */

export type ArtPiece = {
  file: string;
  width: number;
  height: number;
  year?: number;
  /** When set with `year`, pieces share a row group under this heading instead of the plain year. */
  section?: string;
  title?: string;
};

/**
 * Gallery stripes are ordered as entries first appear in this list. Same `year` can
 * appear in multiple stripes if some entries set `section` and others do not (default
 * stripe label is the year). Omit `year` for undated.
 */
export const ART_PIECES: ArtPiece[] = [
  // ── 2023 ──────────────────────────────────────────────────────────────────
  { file: "img_2077.jpg", width: 1274, height: 1600, year: 2023 },
  { file: "img_2062.jpg", width: 1214, height: 1600, year: 2023 },
  { file: "img_2063.jpg", width: 1294, height: 1600, year: 2023 },
  { file: "img_2064.jpg", width: 1188, height: 1600, year: 2023 },
  { file: "img_2065.jpg", width: 1349, height: 1600, year: 2023 },
  { file: "img_2066.jpg", width: 1279, height: 1600, year: 2023 },
  { file: "img_2067.jpg", width: 1324, height: 1600, year: 2023 },
  { file: "img_2068.jpg", width: 1278, height: 1600, year: 2023 },
  { file: "img_2074.jpg", width: 1600, height: 1213, year: 2023 },

  // ── 2021 ──────────────────────────────────────────────────────────────────
  { file: "img_2069.jpg", width: 1319, height: 1600, year: 2021 },
  { file: "img_2070.jpg", width: 1228, height: 1600, year: 2021 },
  { file: "img_2071.jpg", width: 1344, height: 1600, year: 2021 },
  { file: "img_2072.jpg", width: 1244, height: 1600, year: 2021 },
  { file: "img_2073.jpg", width: 1292, height: 1600, year: 2021 },
  { file: "img_2056.jpg", width: 1403, height: 1600, year: 2021 },
  { file: "img_2058.jpg", width: 1204, height: 1600, year: 2021 },
  { file: "img_2059.jpg", width: 1081, height: 1600, year: 2021 },
  { file: "img_2060.jpg", width: 1312, height: 1600, year: 2021 },
  { file: "img_2061.jpg", width: 1600, height: 1274, year: 2021 },

  // ── 2019 ──────────────────────────────────────────────────────────────────
  { file: "img_2037.jpg", width: 1600, height: 1114, year: 2019 },
  { file: "img_2038.jpg", width: 1207, height: 1600, year: 2019 },
  { file: "img_2039.jpg", width: 1251, height: 1600, year: 2019 },
  { file: "img_2040.jpg", width: 1387, height: 1600, year: 2019 },
  { file: "img_2042.jpg", width: 1600, height: 1182, year: 2019 },
  { file: "img_2043.jpg", width: 1600, height: 1326, year: 2019 },
  { file: "img_2044.jpg", width: 1600, height: 1250, year: 2019 },
  { file: "img_2045.jpg", width: 1600, height: 1561, year: 2019 },
  { file: "img_2046.jpg", width: 1335, height: 1600, year: 2019 },
  { file: "img_2048.jpg", width: 1200, height: 1600, year: 2019 },
  { file: "img_2055.jpg", width: 1239, height: 1600, year: 2019 },

  // ── 2018 ──────────────────────────────────────────────────────────────────
  { file: "img_2051.jpg", width: 1600, height: 1245, year: 2018 },
  { file: "img_2052.jpg", width: 1254, height: 1600, year: 2018 },
  { file: "img_2053.jpg", width: 1225, height: 1600, year: 2018 },
  { file: "img_2054.jpg", width: 1200, height: 1600, year: 2018 },

  // ── 2017 ──────────────────────────────────────────────────────────────────
  { file: "img_2050.jpg", width: 1297, height: 1600, year: 2017 },
];

/**
 * Group pieces by year. Pieces without a year fall into the trailing
 * "undated" bucket so the gallery can still show everything.
 */
export function groupArtByYear(pieces: ArtPiece[]) {
  const dated = new Map<number, ArtPiece[]>();
  const undated: ArtPiece[] = [];
  for (const p of pieces) {
    if (typeof p.year === "number") {
      const bucket = dated.get(p.year) ?? [];
      bucket.push(p);
      dated.set(p.year, bucket);
    } else {
      undated.push(p);
    }
  }
  const sortedYears = Array.from(dated.keys()).sort((a, b) => b - a);
  return {
    years: sortedYears.map((year) => ({ year, pieces: dated.get(year)! })),
    undated,
  };
}
