import { AnalysisRepository } from '../repositories/analysisRepository';
import { MeasurementsRepository } from '../repositories/measurementsRepository';
import { PhotoRepository } from '../repositories/photoRepository';
import { enqueueAnalysis } from '../queues/sqs';
import { runPipeline } from '../ml/pipeline';
import { cacheDel } from '../../lib/cache';

type Job = { progress: number; done: boolean; timer?: ReturnType<typeof setInterval> };
const jobs = new Map<string, Job>();

const analysisRepo = new AnalysisRepository();
const measurementsRepo = new MeasurementsRepository();
const photoRepo = new PhotoRepository();

export async function submitAnalysis(address: string): Promise<{ id: string }> {
  const created = await analysisRepo.create({ address, status: 'PROCESSING' as any });
  const job: Job = { progress: 0, done: false };
  await enqueueAnalysis(created.id).catch(() => {});
  job.timer = setInterval(async () => {
    job.progress = Math.min(100, job.progress + 10);
    if (job.progress >= 100 && !job.done) {
      job.done = true;
      if (job.timer) clearInterval(job.timer);
      await cacheDel(`analysis:${created.id}`).catch(() => {});
      let result: any;
      try {
        result = await runPipeline(created.address);
      } catch (err) {
        await analysisRepo.updateStatus(created.id, 'NEEDS_ASSIST' as any, new Date());
        await cacheDel(`analysis:${created.id}`).catch(() => {});
        return;
      }
      const annotatedSvg = (() => {
        const polys: Array<Array<[number, number]>> = result.polygons || [];
        const w = 640, h = 360;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of polys) {
          for (const [x, y] of p) {
            if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
          }
        }
        const pad = 10;
        const polyW = (maxX - minX) || 1;
        const polyH = (maxY - minY) || 1;
        const scale = Math.min((w - pad * 2) / polyW, (h - pad * 2) / polyH);
        const offX = (w - polyW * scale) / 2 - minX * scale;
        const offY = (h - polyH * scale) / 2 - minY * scale;
        const paths = polys.map((p) => {
          const d = p.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${(x * scale + offX).toFixed(1)},${(y * scale + offY).toFixed(1)}`).join(' ') + ' Z';
          return `<path d='${d}' fill='rgba(29,78,216,0.15)' stroke='#1d4ed8' stroke-width='2'/>`;
        }).join('');
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${paths}</svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
      })();
      const m = result.measurements;
      await measurementsRepo.upsertByAnalysisId(created.id, {
        roofAreaSqm: result.measurements.roofAreaSqm,
        roofAreaSqft: result.measurements.roofAreaSqft,
        pitchDeg: result.measurements.pitchDeg,
        slopePct: result.measurements.slopePct,
        perimeterM: result.measurements.perimeterM,
        perimeterFt: result.measurements.perimeterFt,
        featuresCount: result.measurements.featuresCount,
        complexityScore: result.measurements.complexityScore,
        confidenceScore: result.measurements.confidenceScore,
        accuracyPct: result.measurements.accuracyPct,
        pitchConfidencePct: result.measurements.pitchConfidencePct,
        pitchEstimated: result.measurements.pitchEstimated,
        imageryUrl: result.imagery.url,
        annotatedUrl: annotatedSvg,
      } as any);
      const statusFinal = (m.confidenceScore ?? 0) < 70 ? ('NEEDS_ASSIST' as any) : ('COMPLETED' as any);
      await analysisRepo.updateStatus(created.id, statusFinal, new Date());
      await cacheDel(`analysis:${created.id}`).catch(() => {});
    }
  }, 800);
  jobs.set(created.id, job);
  return { id: created.id };
}

export async function getStatus(id: string): Promise<{ status: string; progress: number }> {
  const job = jobs.get(id);
  const analysis = await analysisRepo.getById(id);
  const status = (analysis?.status === 'COMPLETED' || job?.done) ? 'COMPLETED' : analysis?.status || 'PENDING';
  const progress = status === 'COMPLETED' ? 100 : job?.progress ?? 0;
  return { status, progress };
}

export async function getResults(id: string): Promise<{
  analysis: any;
  measurements: any | null;
  photos: any[];
}> {
  const analysis = await analysisRepo.getById(id);
  if (!analysis) return { analysis: null, measurements: null, photos: [] } as any;
  const measurements = (await measurementsRepo.getByAnalysisId(id)) as any;
  const photos = await photoRepo.listByAnalysis(id);
  return { analysis, measurements, photos } as any;
}
