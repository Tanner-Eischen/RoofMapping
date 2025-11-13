"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Measurements = { roofAreaSqm?: number; pitchDeg?: number; perimeterM?: number };

export default function ResultsPage() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  const [data, setData] = useState<{ analysis: any; measurements: Measurements | null } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/analysis/results?id=${encodeURIComponent(id)}`);
      if (res.ok) setData(await res.json());
    })();
  }, [id]);

  const m = data?.measurements;

  return (
    <main className="mx-auto max-w-xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Results</h1>
      <Card>
        <CardHeader>
          <CardTitle>Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          {m ? (
            <ul className="space-y-1">
              <li>Roof area: {m.roofAreaSqm} sqm</li>
              <li>Pitch: {m.pitchDeg}°</li>
              <li>Perimeter: {m.perimeterM} m</li>
            </ul>
          ) : (
            <p>No measurements yet.</p>
          )}
        </CardContent>
      </Card>
      <a href={`/mobile-assist?id=${encodeURIComponent(id)}`} className="underline text-sage-700">Mobile assist</a>
    </main>
  );
}

