import { env } from './env';

export async function proxyRequest(path: string, init?: RequestInit) {
  if (!env.externalApiUrl) throw new Error('external_api_disabled');
  const url = env.externalApiUrl.replace(/\/$/, '') + path;
  const hObj = {
    ...(init?.headers || {}),
    'Content-Type': 'application/json',
  } as Record<string, string>;
  if (env.externalApiKey) hObj.Authorization = `Bearer ${env.externalApiKey}`;
  const res = await fetch(url, { ...init, headers: hObj });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return { ok: res.ok, status: res.status, json } as const;
  } catch {
    return { ok: res.ok, status: res.status, text } as const;
  }
}