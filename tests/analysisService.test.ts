import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.useFakeTimers();

const analysisDb = new Map<string, any>();
const measurementsDb = new Map<string, any>();

vi.mock('../src/repositories/analysisRepository', () => {
  return {
    AnalysisRepository: class {
      async create(data: any) {
        const id = Math.random().toString(36).slice(2);
        const rec = { id, ...data };
        analysisDb.set(id, rec);
        return rec;
      }
      async getById(id: string) {
        return analysisDb.get(id) || null;
      }
      async updateStatus(id: string, status: any) {
        const rec = analysisDb.get(id);
        if (rec) {
          rec.status = status;
          analysisDb.set(id, rec);
          return rec;
        }
        throw new Error('not found');
      }
    },
  };
});

vi.mock('../src/repositories/measurementsRepository', () => {
  return {
    MeasurementsRepository: class {
      async upsertByAnalysisId(id: string, data: any) {
        const merged = { ...(measurementsDb.get(id) || {}), ...data };
        measurementsDb.set(id, merged);
        return merged;
      }
      async getByAnalysisId(id: string) {
        return measurementsDb.get(id) || null;
      }
    },
  };
});

vi.mock('../src/repositories/photoRepository', () => {
  return {
    PhotoRepository: class {
      async add() { return {}; }
      async listByAnalysis() { return []; }
    },
  };
});

import { submitAnalysis, getStatus } from '../src/services/analysisService';

describe('analysisService', () => {
  beforeEach(() => {
    analysisDb.clear();
    measurementsDb.clear();
  });

  it('progresses to completion and updates status', async () => {
    const { id } = await submitAnalysis('123 Main St');
    expect(id).toBeTruthy();
    vi.advanceTimersByTime(8200);
    const status = await getStatus(id);
    expect(status.status).toBe('COMPLETED');
    expect(status.progress).toBe(100);
  });
});
