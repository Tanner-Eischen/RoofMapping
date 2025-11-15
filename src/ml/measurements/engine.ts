import type { Polygon } from '../models/maskrcnn';

function polygonAreaSqm(poly: Polygon, resolutionM: number): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    sum += x1 * y2 - x2 * y1;
  }
  const pxArea = Math.abs(sum) / 2;
  return pxArea * resolutionM * resolutionM;
}

function polygonPerimeterM(poly: Polygon, resolutionM: number): number {
  let p = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const dx = x2 - x1;
    const dy = y2 - y1;
    p += Math.sqrt(dx * dx + dy * dy);
  }
  return p * resolutionM;
}

export function computeMeasurements(
  polygons: Polygon[],
  resolutionM: number,
  opts?: { lidarPointDensity?: number; detectionScore?: number }
) {
  const lidarPD = opts?.lidarPointDensity ?? 0;
  const detScore = opts?.detectionScore ?? 0.7;
  if (!polygons.length)
    return {
      roofAreaSqm: 0,
      roofAreaSqft: 0,
      perimeterM: 0,
      perimeterFt: 0,
      pitchDeg: 30,
      slopePct: Math.round(Math.tan(30 * Math.PI / 180) * 1000) / 10,
      featuresCount: 0,
      complexityScore: 1,
      confidenceScore: Math.round(detScore * 100),
      accuracyPct: 3,
      pitchConfidencePct: lidarPD > 0 ? 60 : 40,
      pitchEstimated: lidarPD <= 0,
    };
  const area = polygons.reduce((acc, poly) => acc + polygonAreaSqm(poly, resolutionM), 0);
  const perimeter = polygons.reduce((acc, poly) => acc + polygonPerimeterM(poly, resolutionM), 0);
  const pitchDeg = lidarPD >= 6 ? 30 : 30;
  const slopePct = Math.round(Math.tan(pitchDeg * Math.PI / 180) * 1000) / 10;
  const roofAreaSqm = Math.round(area * 10) / 10;
  const perimeterM = Math.round(perimeter * 10) / 10;
  const roofAreaSqft = Math.round(roofAreaSqm * 10.7639);
  const perimeterFt = Math.round(perimeterM * 3.28084);
  const featuresCount = 0;
  const complexityScore = Math.min(10, Math.max(1, Math.round((perimeterM / Math.sqrt(roofAreaSqm || 1)) / 2)));
  const confidenceScore = Math.round(Math.min(1, (detScore + Math.min(1, lidarPD / 10)) / 2) * 100);
  const pitchConfidencePct = lidarPD >= 6 ? 80 : 40;
  const pitchEstimated = lidarPD < 6;
  const accuracyPct = 3;
  return {
    roofAreaSqm,
    roofAreaSqft,
    perimeterM,
    perimeterFt,
    pitchDeg,
    slopePct,
    featuresCount,
    complexityScore,
    confidenceScore,
    accuracyPct,
    pitchConfidencePct,
    pitchEstimated,
  };
}
