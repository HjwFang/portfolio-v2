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
  { file: "img_2077.webp", width: 1408, height: 1108, year: 2023 },
  { file: "img_2062.webp", width: 1149, height: 1403, year: 2023 },
  { file: "img_2063.webp", width: 1473, height: 1104, year: 2023 },
  { file: "img_2064.webp", width: 1568, height: 1034, year: 2023 },
  { file: "img_2065.webp", width: 972, height: 1248, year: 2023 },
  { file: "img_2066.webp", width: 1025, height: 1179, year: 2023 },
  { file: "img_2067.webp", width: 900, height: 1152, year: 2023 },
  { file: "img_2068.webp", width: 1088, height: 1398, year: 2023 },
  { file: "img_2074.webp", width: 1119, height: 1533, year: 2023 },

  // ── 2021 ──────────────────────────────────────────────────────────────────
  { file: "img_2069.webp", width: 1082, height: 1424, year: 2021 },
  { file: "img_2070.webp", width: 1182, height: 1452, year: 2021 },
  { file: "img_2071.webp", width: 1182, height: 1392, year: 2021 },
  { file: "img_2072.webp", width: 959, height: 1455, year: 2021 },
  { file: "img_2073.webp", width: 929, height: 1392, year: 2021 },
  { file: "img_2056.webp", width: 1094, height: 1424, year: 2021 },
  { file: "img_2058.webp", width: 1028, height: 1336, year: 2021 },
  { file: "img_2059.webp", width: 1049, height: 1248, year: 2021 },
  { file: "img_2060.webp", width: 1299, height: 1376, year: 2021 },
  { file: "img_2061.webp", width: 1158, height: 1486, year: 2021 },

  // ── 2019 ──────────────────────────────────────────────────────────────────
  { file: "img_2037.webp", width: 1364, height: 1089, year: 2019 },
  { file: "img_2038.webp", width: 1127, height: 1185, year: 2019 },
  { file: "img_2039.webp", width: 1209, height: 1170, year: 2019 },
  { file: "img_2040.webp", width: 1108, height: 1432, year: 2019 },
  { file: "img_2042.webp", width: 1305, height: 1110, year: 2019 },
  { file: "img_2043.webp", width: 1276, height: 1386, year: 2019 },
  { file: "img_2044.webp", width: 1140, height: 1330, year: 2019 },
  { file: "img_2045.webp", width: 1520, height: 1397, year: 2019 },
  { file: "img_2046.webp", width: 1247, height: 1180, year: 2019 },
  { file: "img_2048.webp", width: 1287, height: 1147, year: 2019 },
  { file: "img_2055.webp", width: 1300, height: 1221, year: 2019 },

  // ── 2018 ──────────────────────────────────────────────────────────────────
  { file: "img_2051.webp", width: 1190, height: 1342, year: 2018 },
  { file: "img_2052.webp", width: 1155, height: 1232, year: 2018 },
  { file: "img_2053.webp", width: 1222, height: 1418, year: 2018 },
  { file: "img_2054.webp", width: 1176, height: 1312, year: 2018 },

  // ── 2017 ──────────────────────────────────────────────────────────────────
  { file: "img_2050.webp", width: 1244, height: 1301, year: 2017 },
];

/**
 * Group pieces by year. Pieces without a year fall into the trailing
 * "undated" bucket so the gallery can still show everything.
 */
/** Featured pieces in /public/art/pinned — shown in the gallery pinned carousel. */
export type PinnedArtPiece = {
  file: string;
  width: number;
  height: number;
  title?: string;
};

export const PINNED_ART_PIECES: PinnedArtPiece[] = [
  { file: "dancer.jpeg", width: 3024, height: 4032, title: "Dancer" },
  { file: "head statue 1.jpeg", width: 3024, height: 4032, title: "Head statue 1" },
  { file: "head statue 2.jpeg", width: 3024, height: 4032, title: "Head statue 2" },
  { file: "vb mannequin.jpeg", width: 3024, height: 4032, title: "VB mannequin" },
  { file: "winter gear.jpeg", width: 4029, height: 2676, title: "Winter gear" },
];

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
