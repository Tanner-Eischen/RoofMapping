"use client";
import { Suspense, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
export const dynamic = 'force-dynamic';

export default function MobileAssistPage() {
  const [id, setId] = useState('');
  useEffect(() => {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const val = sp.get('id') || '';
    setId(val);
  }, []);
  return (
    <Suspense fallback={<main className="p-8">Loading…</main>}>
      <main className="py-12">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Assist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">Analysis ID: {id}</p>
              <p className="mt-2 text-slate-600">Guided photo capture and notes.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline">Capture Front Elevation</Button>
                <Button variant="outline">Capture Rear Elevation</Button>
                <Button variant="outline">Capture Left Elevation</Button>
                <Button variant="outline">Capture Right Elevation</Button>
              </div>
              <div className="mt-4 flex gap-3">
                <Button href={`/results?id=${encodeURIComponent(id)}`}>Back to Results</Button>
                <Button variant="ghost" href={`/processing?id=${encodeURIComponent(id)}`}>Resume Processing</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </Suspense>
  );
}
