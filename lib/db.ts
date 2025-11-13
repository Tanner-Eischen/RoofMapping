import { PrismaClient } from '@prisma/client';
import { env } from '../src/env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

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