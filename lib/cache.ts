import { env } from './env';

type CacheEntry = { value: any; expiresAt: number };
const mem = new Map<string, CacheEntry>();

export async function cacheGet(key: string): Promise<any | null> {
  const entry = mem.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    mem.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  mem.set(key, { value, expiresAt });
}

export async function cacheDel(key: string): Promise<void> {
  mem.delete(key);
}

