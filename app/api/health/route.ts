import { NextResponse } from 'next/server';
import { checkDatabase } from '../../../lib/db';
import { env } from '../../../lib/env';

export async function GET() {
  const start = typeof performance !== 'undefined' && 'now' in performance ? performance.now() : Date.now();
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
  const end = typeof performance !== 'undefined' && 'now' in performance ? performance.now() : Date.now();
  const body = { ...payload, responseTimeMs: Math.round(end - start) };
  return NextResponse.json(body, { status: payload.status === 'ok' ? 200 : 503 });
}

