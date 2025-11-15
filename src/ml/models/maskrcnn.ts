export type Polygon = Array<[number, number]>;
export type Detection = { polygon: Polygon; score: number };

const CONFIDENCE_THRESHOLD = 0.7;

export async function detectRoofPolygons(imageId: string): Promise<Detection[]> {
  // Stubbed detections: simulate two polygons with scores
  const base: Polygon = [
    [0, 0],
    [10, 0],
    [10, 12],
    [0, 12],
  ];
  const alt: Polygon = [
    [2, 1],
    [8, 1],
    [8, 9],
    [2, 9],
  ];
  return [
    { polygon: base, score: 0.82 },
    { polygon: alt, score: 0.65 },
  ];
}

export function selectDetections(dets: Detection[]): Polygon[] {
  const above = dets.filter((d) => d.score >= CONFIDENCE_THRESHOLD);
  if (!above.length) return [];
  // Select largest polygon(s) by area; return the top one
  function area(poly: Polygon) {
    let sum = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      sum += x1 * y2 - x2 * y1;
    }
    return Math.abs(sum) / 2;
  }
  above.sort((a, b) => area(b.polygon) - area(a.polygon));
  return [above[0].polygon];
}
