"use client";
import { Suspense, useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
export const dynamic = 'force-dynamic';

export default function ProcessingPage() {
  const [id, setId] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const [info, setInfo] = useState('Analyzing Roof');
  const [longWait, setLongWait] = useState(false);
  const [timeoutHit, setTimeoutHit] = useState(false);

  useEffect(() => {
    if (!id) return;
    setInfo('Processing satellite and LiDAR data...');
    const start = Date.now();
    let longSet = false;
    let timeoutSet = false;
    const delay = setTimeout(() => {
      let aborted = false;
      const t = setInterval(async () => {
        const controller = new AbortController();
        const abortTick = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(`/api/analysis/status?id=${encodeURIComponent(id)}`, { signal: controller.signal });
          clearTimeout(abortTick);
          if (!res.ok) return;
          const data = await res.json();
          setProgress(data.progress ?? 0);
          setStatus(data.status ?? 'PENDING');
          const elapsed = Date.now() - start;
          if (elapsed > 30000 && !longSet) {
            longSet = true;
            setLongWait(true);
          }
          if (elapsed > 60000 && !timeoutSet) {
            timeoutSet = true;
            setTimeoutHit(true);
            clearInterval(t);
          }
          if (data.status === 'COMPLETED') {
            clearInterval(t);
            window.location.href = `/results?id=${encodeURIComponent(id)}`;
          }
          if (data.status === 'NEEDS_ASSIST') {
            clearInterval(t);
            window.location.href = `/mobile-assist?id=${encodeURIComponent(id)}`;
          }
        } catch {}
        if (aborted) clearTimeout(abortTick);
      }, 2000);
      return () => {
        aborted = true;
        clearInterval(t);
      };
    }, 2000);
    return () => clearTimeout(delay);
  }, [id]);

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
              <CardTitle>Processing Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{info}</p>
              <p className="mt-2 text-slate-600">Status: {status}</p>
              <div className="mt-6">
                <Progress value={progress} />
                <p className="mt-2 text-sm text-slate-600">{progress}%</p>
              </div>
              {longWait && !timeoutHit && (
                <p className="mt-4 text-sm text-amber-600">Taking longer than expected…</p>
              )}
              {timeoutHit && (
                <div className="mt-4">
                  <p className="text-sm text-amber-700">Timeout reached. You can retry or proceed to Mobile Assist.</p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setLongWait(false);
                      setTimeoutHit(false);
                      setProgress(0);
                      window.location.href = `/processing?id=${encodeURIComponent(id)}`;
                    }}>Retry</Button>
                    <Button href={`/mobile-assist?id=${encodeURIComponent(id)}`}>Mobile Assist</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </Suspense>
  );
}
