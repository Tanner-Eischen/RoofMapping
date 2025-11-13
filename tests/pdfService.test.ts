import { describe, it, expect } from 'vitest';
import { buildAnalysisPdf } from '../src/services/pdfService';

describe('pdfService', () => {
  it('generates a valid PDF buffer', async () => {
    const bytes = await buildAnalysisPdf({
      id: 'abc123',
      address: '123 Main St',
      measurements: { roofAreaSqm: 100, pitchDeg: 25, perimeterM: 80 },
    });
    expect(bytes.length).toBeGreaterThan(100);
    const header = new TextDecoder().decode(bytes.slice(0, 8));
    expect(header.startsWith('%PDF-')).toBe(true);
  });
});
