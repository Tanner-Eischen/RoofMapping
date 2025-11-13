import { prisma } from '../../lib/db';
import type { Measurements } from '@prisma/client';

export class MeasurementsRepository {
  async upsertByAnalysisId(analysisId: string, data: Omit<Measurements, 'id' | 'analysisId'>): Promise<Measurements> {
    return prisma.measurements.upsert({
      where: { analysisId },
      update: data,
      create: { analysisId, ...data },
    });
  }

  async getByAnalysisId(analysisId: string): Promise<Measurements | null> {
    return prisma.measurements.findUnique({ where: { analysisId } });
  }
}
