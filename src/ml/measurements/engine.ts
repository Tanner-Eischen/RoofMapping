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

export function computeMeasurements(polygons: Polygon[], resolutionM: number) {
  if (!polygons.length) return { roofAreaSqm: 0, pitchDeg: 30, perimeterM: 0 };
  const area = polygons.reduce((acc, poly) => acc + polygonAreaSqm(poly, resolutionM), 0);
  const perimeter = polygons.reduce((acc, poly) => acc + polygonPerimeterM(poly, resolutionM), 0);
  return { roofAreaSqm: Math.round(area * 10) / 10, pitchDeg: 30, perimeterM: Math.round(perimeter * 10) / 10 };
}

