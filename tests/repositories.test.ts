import { describe, it, expect, beforeEach } from 'vitest';
import { AnalysisRepository } from '../src/repositories/analysisRepository';

describe('AnalysisRepository', () => {
  let repo: AnalysisRepository;
  beforeEach(() => {
    repo = new AnalysisRepository();
  });

  it('creates analysis and reads it back', async () => {
    const created = await repo.create({ address: 'Main St', status: 'PENDING' as any });
    expect(created).toMatchObject({ address: 'Main St', status: 'PENDING' });
    const fetched = await repo.getById(created.id);
    expect(fetched).toMatchObject({ address: 'Main St', status: 'PENDING' });
  });

  it('returns null for missing id', async () => {
    const missing = await repo.getById('missing');
    expect(missing).toBeNull();
  });
});