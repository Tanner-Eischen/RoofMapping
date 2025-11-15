import { NextResponse } from 'next/server';
import { PhotoRepository } from '../../../../src/repositories/photoRepository';

const repo = new PhotoRepository();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = (body?.id || '').toString();
  const url = (body?.url || '').toString();
  const width = body?.width ? Number(body.width) : undefined;
  const height = body?.height ? Number(body.height) : undefined;
  if (!id || !url) return NextResponse.json({ error: 'id_url_required' }, { status: 400 });
  const photo = await repo.add(id, url, { width, height });
  return NextResponse.json(photo, { status: 201 });
}

