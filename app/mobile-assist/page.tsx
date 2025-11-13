"use client";
import { useSearchParams } from 'next/navigation';

export default function MobileAssistPage() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Mobile Assist</h1>
      <p className="mt-2 text-slate-600">Analysis ID: {id}</p>
      <p className="mt-2 text-slate-600">Guided photo capture and notes coming soon.</p>
    </main>
  );
}

