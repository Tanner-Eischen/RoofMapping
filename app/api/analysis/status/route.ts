import { NextResponse } from 'next/server';
import { getStatus } from '@/src/services/analysisService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').toString();
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  const status = await getStatus(id);
  return NextResponse.json(status);
}

