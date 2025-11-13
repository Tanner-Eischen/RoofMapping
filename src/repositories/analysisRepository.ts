import { prisma } from '../../lib/db';
import type { Analysis } from '@prisma/client';

export class AnalysisRepository {
  async create(data: Pick<Analysis, 'address' | 'status'>): Promise<Analysis> {
    return prisma.analysis.create({ data });
  }

  async getById(id: string): Promise<Analysis | null> {
    return prisma.analysis.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: Analysis['status']): Promise<Analysis> {
    return prisma.analysis.update({ where: { id }, data: { status } });
  }
}
