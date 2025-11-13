import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisRepository } from '../src/repositories/analysisRepository';

vi.mock('@prisma/client', () => {
  const create = vi.fn(async (args) => ({ id: 'uuid', ...args.data }));
  const findUnique = vi.fn(async ({ where }: any) => (where.id === 'found' ? { id: 'found', address: '123 St', status: 'PENDING' } : null));
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      analysis: { create, findUnique },
      measurements: {},
      photo: {},
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    })),
  };
});

describe('AnalysisRepository', () => {
  let repo: AnalysisRepository;
  beforeEach(() => {
    repo = new AnalysisRepository();
  });

  it('creates analysis via prisma', async () => {
    const created = await repo.create({ address: 'Main St', status: 'PENDING' as any });
    expect(created).toMatchObject({ address: 'Main St', status: 'PENDING' });
  });

  it('finds analysis by id', async () => {
    const found = await repo.getById('found');
    expect(found).toBeTruthy();
    const missing = await repo.getById('missing');
    expect(missing).toBeNull();
  });
});