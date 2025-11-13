import { PrismaClient } from '@prisma/client';
import { env } from '../src/env';

const globalForPrisma = globalThis as unknown as { prisma?: any };

function createInMemoryPrisma() {
  const analyses = new Map<string, any>();
  const measurements = new Map<string, any>();
  const photos = new Map<string, any>();
  const uuid = () => Math.random().toString(36).slice(2);
  return {
    analysis: {
      create: async ({ data }: any) => {
        const id = uuid();
        const rec = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        analyses.set(id, rec);
        return rec;
      },
      findUnique: async ({ where }: any) => analyses.get(where.id) || null,
      update: async ({ where, data }: any) => {
        const rec = analyses.get(where.id);
        if (!rec) throw new Error('not found');
        const updated = { ...rec, ...data, updatedAt: new Date() };
        analyses.set(where.id, updated);
        return updated;
      },
    },
    measurements: {
      upsert: async ({ where, update, create }: any) => {
        const existing = measurements.get(where.analysisId);
        if (existing) {
          const merged = { ...existing, ...update };
          measurements.set(where.analysisId, merged);
          return merged;
        }
        const id = uuid();
        const rec = { id, analysisId: create.analysisId, ...create };
        measurements.set(where.analysisId, rec);
        return rec;
      },
      findUnique: async ({ where }: any) => measurements.get(where.analysisId) || null,
    },
    photo: {
      create: async ({ data }: any) => {
        const id = uuid();
        const rec = { id, createdAt: new Date(), ...data };
        photos.set(id, rec);
        return rec;
      },
      findMany: async ({ where, orderBy }: any) => {
        const list = Array.from(photos.values()).filter((p) => p.analysisId === where.analysisId);
        if (orderBy?.createdAt === 'asc') list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        return list;
      },
    },
    $connect: async () => {},
    $disconnect: async () => {},
  } as const;
}

export const prisma =
  globalForPrisma.prisma ||
  (process.env.NODE_ENV === 'test'
    ? new PrismaClient({ log: ['error', 'warn'] })
    : env.databaseUrl
    ? new PrismaClient({ log: ['error', 'warn'] })
    : createInMemoryPrisma());

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabase(): Promise<boolean> {
  if (!env.databaseUrl || env.skipDbCheck) return false;
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (err) {
    return false;
  }
}
