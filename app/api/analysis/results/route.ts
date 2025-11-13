import { NextResponse } from 'next/server';
import { getResults } from '@/src/services/analysisService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').toString();
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  const data = await getResults(id);
  return NextResponse.json(data);
}

