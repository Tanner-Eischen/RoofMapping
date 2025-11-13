import { describe, it, expect } from 'vitest';
import { getHealth } from '../api/health';

describe('health endpoint helper', () => {
  it('returns ok or degraded with required fields', () => {
    const payload = getHealth();
    expect(payload).toHaveProperty('status');
    expect(['ok', 'degraded', 'unhealthy']).toContain(payload.status);
    expect(typeof payload.uptime).toBe('number');
    expect(typeof payload.timestamp).toBe('string');
    expect(payload.checks).toBeDefined();
    expect(['healthy', 'unhealthy', 'unknown']).toContain(payload.checks.db);
    expect(['healthy', 'unhealthy', 'unknown']).toContain(payload.checks.redis);
    expect(['healthy', 'unhealthy', 'unknown']).toContain(payload.checks.sqs);
  });
});