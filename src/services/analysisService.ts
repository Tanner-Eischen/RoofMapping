import { AnalysisRepository } from '../repositories/analysisRepository';
import { MeasurementsRepository } from '../repositories/measurementsRepository';
import { PhotoRepository } from '../repositories/photoRepository';

type Job = { progress: number; done: boolean; timer?: NodeJS.Timer };
const jobs = new Map<string, Job>();

const analysisRepo = new AnalysisRepository();
const measurementsRepo = new MeasurementsRepository();
const photoRepo = new PhotoRepository();

export async function submitAnalysis(address: string): Promise<{ id: string }> {
  const created = await analysisRepo.create({ address, status: 'PROCESSING' as any });
  const job: Job = { progress: 0, done: false };
  job.timer = setInterval(async () => {
    job.progress = Math.min(100, job.progress + 10);
    if (job.progress >= 100 && !job.done) {
      job.done = true;
      if (job.timer) clearInterval(job.timer);
      await measurementsRepo.upsertByAnalysisId(created.id, {
        roofAreaSqm: 120.5,
        pitchDeg: 30.0,
        perimeterM: 85.2,
      } as any);
      await analysisRepo.updateStatus(created.id, 'COMPLETED' as any);
    }
  }, 800);
  jobs.set(created.id, job);
  return { id: created.id };
}

export async function getStatus(id: string): Promise<{ status: string; progress: number }> {
  const job = jobs.get(id);
  const analysis = await analysisRepo.getById(id);
  const status = analysis?.status || 'PENDING';
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
