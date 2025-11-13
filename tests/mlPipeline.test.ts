import { describe, it, expect } from 'vitest';
import { runPipeline } from '../src/ml/pipeline';

describe('ml pipeline', () => {
  it('produces measurements from polygons', async () => {
    const out = await runPipeline('123 Main St');
    expect(out.measurements.roofAreaSqm).toBeGreaterThan(0);
    expect(out.measurements.perimeterM).toBeGreaterThan(0);
    expect(Array.isArray(out.polygons)).toBe(true);
    expect(out.imagery.resolutionM).toBe(10);
  });
});

