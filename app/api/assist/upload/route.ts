import { NextResponse } from 'next/server';
import { PhotoRepository } from '../../../../src/repositories/photoRepository';
import { cacheDel } from '../../../../lib/cache';

const repo = new PhotoRepository();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = (body?.id || '').toString();
  const url = (body?.url || '').toString();
  if (!id || !url) return NextResponse.json({ error: 'id_url_required' }, { status: 400 });
  const photo = await repo.add(id, url);
  await cacheDel(`analysis:${id}`).catch(() => {});
  return NextResponse.json(photo, { status: 201 });
}
