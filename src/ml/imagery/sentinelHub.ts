import { env } from '../../../lib/env';

let accessToken: string | null = null;
let tokenExpiry = 0;

async function refreshToken() {
  if (!env.sentinelHubClientId || !env.sentinelHubClientSecret) {
    throw new Error('Sentinel Hub credentials not configured');
  }
  const res = await fetch(env.sentinelHubAuthUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.sentinelHubClientId,
      client_secret: env.sentinelHubClientSecret,
    }),
  });
  if (!res.ok) throw new Error('auth_failed');
  const json = await res.json();
  accessToken = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000; // refresh 60s early
}

async function ensureToken() {
  if (!accessToken || Date.now() >= tokenExpiry) await refreshToken();
}

export type Sentinel2Image = {
  id: string;
  resolutionM: number;
  bands: string[];
  url: string;
  cloudCoverage: number;
};

export async function fetchSentinel2(lat: number, lng: number): Promise<Sentinel2Image> {
  const id = `s2-${lat.toFixed(5)}-${lng.toFixed(5)}`;
  await ensureToken();
  const bbox = [
    lng - 0.001,
    lat - 0.001,
    lng + 0.001,
    lat + 0.001,
  ].join(',');
  const evalscript = encodeURIComponent(env.sentinelHubEvalScript);
  const timeFrom = new Date(Date.now() - env.sentinelHubTimeRangeDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const timeTo = new Date().toISOString().split('T')[0];
  const url = `${env.sentinelHubProcessUrl}?bbox=${bbox}&time=${timeFrom}/${timeTo}&evalscript=${evalscript}&width=${env.sentinelHubSize}&height=${env.sentinelHubSize}&format=${env.sentinelHubFormat}&layer=${env.sentinelHubLayerId}&maxcc=${env.sentinelHubMaxCloud}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('imagery_fetch_failed');
  const ab = await res.arrayBuffer();
  const base64 = Buffer.from(ab).toString('base64');
  const dataUrl = `data:${env.sentinelHubFormat};base64,${base64}`;
  return {
    id,
    resolutionM: env.sentinelHubResolution,
    bands: ['B04', 'B03', 'B02'],
    url: dataUrl,
    cloudCoverage: 0,
  };
}

export function revokeObjectUrl(url: string) {
  try { URL.revokeObjectURL(url); } catch {}
}