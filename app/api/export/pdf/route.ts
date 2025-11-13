import { NextResponse } from 'next/server';
import { getResults } from '@/src/services/analysisService';
import { buildAnalysisPdf } from '@/src/services/pdfService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').toString();
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 });
  const data = await getResults(id);
  if (!data.analysis) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const pdf = await buildAnalysisPdf({ id, address: data.analysis.address, measurements: data.measurements });
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="analysis-${id}.pdf"`,
    },
  });
}

