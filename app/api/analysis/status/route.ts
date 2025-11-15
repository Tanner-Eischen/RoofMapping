import { NextResponse } from 'next/server';
import { getStatus } from '../../../../src/services/analysisService';
import { proxyRequest } from '../../../../lib/http';
import { env } from '../../../../lib/env';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').toString();
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  if (env.externalApiUrl) {
    try {
      const res = await proxyRequest(`/analysis/status?id=${encodeURIComponent(id)}`);
      if (res.ok) return NextResponse.json(res.json);
      // Fallback to local
    } catch {
      // Fallback to local
    }
  }
  const status = await getStatus(id);
  return NextResponse.json(status);
}

