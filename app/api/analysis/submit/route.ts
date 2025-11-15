import { NextResponse } from 'next/server';
import { submitAnalysis } from '../../../../src/services/analysisService';
import { proxyRequest } from '../../../../lib/http';
import { env } from '../../../../lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const address = (body?.address || '').toString().trim();
    if (!address) return NextResponse.json({ error: 'address_required' }, { status: 400 });
    if (env.externalApiUrl) {
      try {
        const res = await proxyRequest('/analysis/submit', { method: 'POST', body: JSON.stringify({ address }) });
        if (res.ok) return NextResponse.json(res.json);
      } catch {}
    }
    const { id } = await submitAnalysis(address);
    return NextResponse.json({ id });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}

export async function GET() {
  try {
    const { id } = await submitAnalysis('Demo Address');
    return NextResponse.json({ id });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}

