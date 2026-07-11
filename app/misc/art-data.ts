/**
 * Catalog of art pieces shown on /misc.
 *
 * Each entry references a WebP in /public/art/cleaned/ (full size) and
 * /public/art/cleaned/thumb/ (small grid preview). Width/height are the
 * post-clean intrinsic dimensions so the gallery can render aspect-ratio
 * accurate tiles without measuring at runtime.
 *
 * Optional fields:
 *  - year:   the year the piece was made (used for grouping). Leave undefined
 *            if unknown so the piece falls into the "undated" bucket.
 *  - section: optional subsection title within a year (e.g. several stripes under 2021).
 *  - title:  short human label, otherwise the alt text falls back to "untitled".
 *  - displayRotateDeg: optional clockwise rotation in the gallery (-90, 90, or 180).
 */

/** Clockwise correction for how the photo was shot vs the drawing (file pixels unchanged). */
export type ArtDisplayRotateDeg = -90 | 90 | 180;

export type ArtPiece = {
  file: string;
  width: number;
  height: number;
  year?: number;
  /** When set with `year`, pieces share a row group under this heading instead of the plain year. */
  section?: string;
  title?: string;
  /** Display rotation so the sketch reads upright in the grid. */
  displayRotateDeg?: ArtDisplayRotateDeg;
};

/** Width/height after display rotation (swap for ±90°). */
export function artPieceLayoutDimensions(p: ArtPiece) {
  const r = p.displayRotateDeg ?? 0;
  if (r === 90 || r === -90) {
    return { width: p.height, height: p.width };
  }
  return { width: p.width, height: p.height };
}

/** Newest year first; stable order within the same year. */
export function sortArtPiecesByYear(pieces: ArtPiece[]) {
  return pieces
    .map((piece, index) => ({ piece, index }))
    .sort((a, b) => {
      const yearA = a.piece.year ?? Number.NEGATIVE_INFINITY;
      const yearB = b.piece.year ?? Number.NEGATIVE_INFINITY;
      if (yearA !== yearB) return yearB - yearA;
      return a.index - b.index;
    })
    .map(({ piece }) => piece);
}

export type ArtPieceYearSpan = {
  year: number | "undated";
  start: number;
  end: number;
};

export function artPieceYearSpans(pieces: ArtPiece[]): ArtPieceYearSpan[] {
  const spans: ArtPieceYearSpan[] = [];

  pieces.forEach((piece, index) => {
    const year = piece.year ?? "undated";
    const last = spans[spans.length - 1];
    if (last && last.year === year) {
      last.end = index;
    } else {
      spans.push({ year, start: index, end: index });
    }
  });

  return spans;
}

/**
 * Gallery stripes are ordered as entries first appear in this list. Same `year` can
 * appear in multiple stripes if some entries set `section` and others do not (default
 * stripe label is the year). Omit `year` for undated.
 */
export const ART_PIECES: ArtPiece[] = [
  // ── 2023 ──────────────────────────────────────────────────────────────────
  { file: "img_2077.webp", width: 1274, height: 1600, year: 2023 },
  { file: "img_2062.webp", width: 1214, height: 1600, year: 2023, displayRotateDeg: 90 },
  { file: "img_2063.webp", width: 1294, height: 1600, year: 2023, displayRotateDeg: -90 },
  { file: "img_2064.webp", width: 1188, height: 1600, year: 2023, displayRotateDeg: -90 },
  { file: "img_2065.webp", width: 1349, height: 1600, year: 2023, displayRotateDeg: 90 },
  { file: "img_2066.webp", width: 1279, height: 1600, year: 2023, displayRotateDeg: 90 },
  { file: "img_2067.webp", width: 1324, height: 1600, year: 2023 },
  { file: "img_2068.webp", width: 1278, height: 1600, year: 2023, displayRotateDeg: 180 },
  { file: "img_2074.webp", width: 1600, height: 1213, year: 2023, displayRotateDeg: -90 },

  // ── 2021 ──────────────────────────────────────────────────────────────────
  { file: "img_2069.webp", width: 1319, height: 1600, year: 2021 },
  { file: "img_2070.webp", width: 1228, height: 1600, year: 2021, displayRotateDeg: 180 },
  { file: "img_2071.webp", width: 1344, height: 1600, year: 2021 },
  { file: "img_2072.webp", width: 1244, height: 1600, year: 2021 },
  { file: "img_2073.webp", width: 1292, height: 1600, year: 2021, displayRotateDeg: -90 },
  { file: "img_2056.webp", width: 1403, height: 1600, year: 2021 },
  { file: "img_2058.webp", width: 1204, height: 1600, year: 2021 },
  { file: "img_2059.webp", width: 1081, height: 1600, year: 2021 },
  { file: "img_2060.webp", width: 1312, height: 1600, year: 2021 },
  { file: "img_2061.webp", width: 1600, height: 1274, year: 2021 },

  // ── 2019 ──────────────────────────────────────────────────────────────────
  { file: "img_2037.webp", width: 1600, height: 1114, year: 2019 },
  { file: "img_2038.webp", width: 1207, height: 1600, year: 2019 },
  { file: "img_2039.webp", width: 1251, height: 1600, year: 2019 },
  { file: "img_2040.webp", width: 1387, height: 1600, year: 2019 },
  { file: "img_2042.webp", width: 1600, height: 1182, year: 2019, displayRotateDeg: 90 },
  { file: "img_2043.webp", width: 1600, height: 1326, year: 2019, displayRotateDeg: 90 },
  { file: "img_2044.webp", width: 1600, height: 1250, year: 2019 },
  { file: "img_2045.webp", width: 1600, height: 1561, year: 2019 },
  { file: "img_2046.webp", width: 1335, height: 1600, year: 2019 },
  { file: "img_2048.webp", width: 1200, height: 1600, year: 2019 },
  { file: "img_2055.webp", width: 1239, height: 1600, year: 2019 },

  // ── 2018 ──────────────────────────────────────────────────────────────────
  { file: "img_2051.webp", width: 1600, height: 1245, year: 2018, displayRotateDeg: 90 },
  { file: "img_2052.webp", width: 1254, height: 1600, year: 2018 },
  { file: "img_2053.webp", width: 1225, height: 1600, year: 2018 },
  { file: "img_2054.webp", width: 1200, height: 1600, year: 2018 },

  // ── 2017 ──────────────────────────────────────────────────────────────────
  { file: "img_2050.webp", width: 1297, height: 1600, year: 2017 },
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
