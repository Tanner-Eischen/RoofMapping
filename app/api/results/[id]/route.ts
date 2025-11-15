import { NextResponse } from 'next/server';
import { getResults } from '../../../../src/services/analysisService';
import { runPipelineQuick } from '../../../../src/ml/pipeline';
import { cacheGet, cacheSet } from '../../../../lib/cache';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = (params?.id || '').toString();
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  const cacheKey = `analysis:${id}`;
  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {}
  const data = await getResults(id);
  if (!data.analysis) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  try {
    const pipe = await runPipelineQuick(data.analysis.address);
    const payload = {
      ...data,
      measurements: data.measurements || pipe.measurements,
      overlay: { polygons: pipe.polygons, resolutionM: pipe.imagery.resolutionM, tileSize: (pipe.imagery as any).tileSize || 256 },
      imagery: { url: pipe.imagery.url, cloudCoverage: pipe.imagery.cloudCoverage },
      lidar: { pointDensity: pipe.lidar.pointDensity },
    };
    if ((data.analysis.status || '').toUpperCase() === 'COMPLETED') {
      try { await cacheSet(cacheKey, payload, 3600); } catch {}
      return NextResponse.json(payload);
    }
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-cache' } });
  } catch {
    return NextResponse.json(data);
  }
}
