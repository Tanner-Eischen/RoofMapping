"use client";
import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AssistPage() {
  const [id, setId] = useState('');
  const [photos, setPhotos] = useState<Array<File | null>>([null, null, null]);
  const [previews, setPreviews] = useState<Array<string | null>>([null, null, null]);
  const [loading, setLoading] = useState(false);
  const [openCamIndex, setOpenCamIndex] = useState<number | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    setId(sp.get('id') || '');
  }, []);

  function onChoose(i: number, f: File | null) {
    const next = [...photos];
    next[i] = f;
    setPhotos(next);
    const np = [...previews];
    np[i] = f ? URL.createObjectURL(f) : null;
    setPreviews(np);
  }

  async function compressImage(file: File | Blob, maxDim = 1920, quality = 0.85): Promise<File> {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    await new Promise<void>((r) => { img.onload = () => r(); img.src = url; });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(img, 0, 0, cw, ch);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', quality));
    URL.revokeObjectURL(url);
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  }

  async function submit() {
    if (!id) return;
    setLoading(true);
    for (let i = 0; i < photos.length; i++) {
      const f = photos[i];
      if (!f) continue;
      const comp = await compressImage(f);
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => { reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(comp); });
      await fetch('/api/assist/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, url: base64 }),
      });
    }
    setLoading(false);
    window.location.href = `/results?id=${encodeURIComponent(id)}`;
  }

  const ready = photos.every((p) => !!p);

  return (
    <main className="py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mobile Assist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">Satellite confidence is low. Please capture three photos to assist measurement.</p>
          </CardContent>
        </Card>

        {["Front", "Left Side", "Right Side"].map((label, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              {previews[i] ? (
                <div className="mt-2">
                  <img src={previews[i] as string} alt={`${label} preview`} className="max-h-48 rounded" />
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" onClick={() => onChoose(i, null)}>Re-take</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex gap-2 items-center">
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => onChoose(i, e.target.files?.[0] || null)} />
                  <Button variant="outline" onClick={() => setOpenCamIndex(i)}>Use Camera</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3">
          <Button onClick={submit} disabled={!ready || loading}>{loading ? 'Uploading…' : 'Submit'}</Button>
          <Button variant="ghost" href={`/results?id=${encodeURIComponent(id)}`}>Skip</Button>
        </div>

        {openCamIndex !== null && <CameraModal onClose={() => setOpenCamIndex(null)} onCapture={async (blob) => {
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          onChoose(openCamIndex as number, file);
          setOpenCamIndex(null);
        }} />}
      </div>
    </main>
  );
}

function CameraModal({ onClose, onCapture }: { onClose: () => void; onCapture: (b: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = s;
        const v = videoRef.current;
        if (v) {
          v.srcObject = s;
          await v.play();
        }
      } catch {}
    })();
    return () => {
      stopped = true;
      const s = streamRef.current;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  async function capture() {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(v, 0, 0, w, h);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.9));
    onCapture(blob);
  }
  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center">
      <div className="bg-white rounded p-4 w-[90vw] max-w-xl">
        <p className="font-medium">Camera</p>
        <div className="relative mt-2">
          <video ref={videoRef} className="w-full h-auto" playsInline />
          <div className="absolute inset-0 pointer-events-none border-4 border-white/50" />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={capture}>Capture</Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
