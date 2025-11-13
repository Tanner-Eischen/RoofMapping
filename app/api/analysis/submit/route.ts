import { NextResponse } from 'next/server';
import { submitAnalysis } from '@/src/services/analysisService';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const address = (body?.address || '').toString();
  if (!address) return NextResponse.json({ error: 'address_required' }, { status: 400 });
  const { id } = await submitAnalysis(address);
  return NextResponse.json({ id });
}

