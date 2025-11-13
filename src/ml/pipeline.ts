import { fetchSentinel2 } from './imagery/sentinel2';
import { fetchUsgsLidar } from './lidar/usgs';
import { detectRoofPolygons } from './models/maskrcnn';
import { computeMeasurements } from './measurements/engine';

export async function runPipeline(address: string) {
  const s2 = await fetchSentinel2(address);
  const lidar = await fetchUsgsLidar(address);
  const polys = await detectRoofPolygons(s2.id);
  const m = computeMeasurements(polys, s2.resolutionM);
  return { imagery: s2, lidar, polygons: polys, measurements: m };
}

