"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

export default function ProcessingPage() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('PENDING');

  useEffect(() => {
    if (!id) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/analysis/status?id=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json();
      setProgress(data.progress ?? 0);
      setStatus(data.status ?? 'PENDING');
      if (data.status === 'COMPLETED') {
        clearInterval(t);
        window.location.href = `/results?id=${encodeURIComponent(id)}`;
      }
    }, 1000);
    return () => clearInterval(t);
  }, [id]);

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Processing</h1>
      <p className="mt-2 text-slate-600">Status: {status}</p>
      <div className="mt-6">
        <Progress value={progress} />
        <p className="mt-2 text-sm text-slate-600">{progress}%</p>
      </div>
    </main>
  );
}

