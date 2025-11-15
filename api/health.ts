export type HealthPayload = {
  status: 'ok' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  checks: {
    db: 'healthy' | 'unhealthy' | 'unknown';
    redis: 'healthy' | 'unhealthy' | 'unknown';
    sqs: 'healthy' | 'unhealthy' | 'unknown';
  };
};

export function getHealth(): HealthPayload {
  const checks: HealthPayload['checks'] = {
    db: 'unknown',
    redis: 'unknown',
    sqs: 'unknown',
  };

  const allHealthy = Object.values(checks).every((c) => c === 'healthy');
  const status: HealthPayload['status'] = allHealthy ? 'ok' : 'degraded';

  return {
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks,
  };
}

import { checkDatabase } from '../lib/db';
import { env } from '../lib/env';

export default async function handler(req: any, res: any) {
  const start = performance.now?.() ?? Date.now();

  // Compute dynamic DB check if configured; keep others as unknown
  let dbStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
  if (env.databaseUrl && !env.skipDbCheck) {
    dbStatus = (await checkDatabase()) ? 'healthy' : 'unhealthy';
  }

  const payload = {
    status: dbStatus === 'healthy' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: { db: dbStatus, redis: 'unknown' as const, sqs: 'unknown' as const },
  } as const;

  const durationMs = (performance.now?.() ?? Date.now()) - start;
  res.status(payload.status === 'ok' ? 200 : 503).json({
    ...payload,
    responseTimeMs: Math.round(durationMs),
  });
}