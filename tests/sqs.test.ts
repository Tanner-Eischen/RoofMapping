import { describe, it, expect } from 'vitest';
import { enqueueAnalysis, _peekQueue } from '../src/queues/sqs';

describe('sqs stub', () => {
  it('no-op when queue url missing', async () => {
    const ok = await enqueueAnalysis('id1');
    expect(ok).toBe(false);
    expect(_peekQueue().length).toBe(0);
  });
});

