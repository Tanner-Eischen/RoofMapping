import { prisma } from '../../lib/db';
import type { Photo } from '@prisma/client';

export class PhotoRepository {
  async add(analysisId: string, url: string, meta?: { width?: number; height?: number }): Promise<Photo> {
    return prisma.photo.create({ data: { analysisId, url, ...meta } });
  }

  async listByAnalysis(analysisId: string): Promise<Photo[]> {
    return prisma.photo.findMany({ where: { analysisId }, orderBy: { createdAt: 'asc' } });
  }
}