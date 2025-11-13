import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function buildAnalysisPdf(input: {
  id: string;
  address?: string;
  measurements?: { roofAreaSqm?: number; pitchDeg?: number; perimeterM?: number } | null;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, y: number, size = 14) => {
    page.drawText(text, { x: 50, y, size, font, color: rgb(0, 0, 0) });
  };
  draw('Roof Analysis Report', 790, 18);
  draw(`Analysis ID: ${input.id}`, 760);
  if (input.address) draw(`Address: ${input.address}`, 740);
  const m = input.measurements || {};
  draw('Measurements:', 700, 16);
  draw(`Roof area: ${m.roofAreaSqm ?? 'N/A'} sqm`, 680);
  draw(`Pitch: ${m.pitchDeg ?? 'N/A'}°`, 660);
  draw(`Perimeter: ${m.perimeterM ?? 'N/A'} m`, 640);
  const bytes = await pdfDoc.save();
  return bytes;
}

