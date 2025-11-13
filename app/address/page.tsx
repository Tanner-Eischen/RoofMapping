"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AddressPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/analysis/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!res.ok) {
      setError('Submission failed');
      setLoading(false);
      return;
    }
    const data = await res.json();
    window.location.href = `/processing?id=${encodeURIComponent(data.id)}`;
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Enter address</h1>
      <p className="mt-2 text-slate-600">Submit the address to start roof analysis.</p>
      <div className="mt-6 space-y-3">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button onClick={submit} disabled={!address || loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
      </div>
    </main>
  );
}

