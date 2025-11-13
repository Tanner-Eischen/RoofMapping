type CacheRecord<T> = { value: T; expiresAt?: number };

class InMemoryCache {
  private store = new Map<string, CacheRecord<any>>();
  get<T>(key: string): T | null {
    const rec = this.store.get(key);
    if (!rec) return null;
    if (rec.expiresAt && rec.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return rec.value as T;
  }
  set<T>(key: string, value: T, ttlMs?: number) {
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
    this.store.set(key, { value, expiresAt });
  }
  del(key: string) {
    this.store.delete(key);
  }
}

export const cache = new InMemoryCache();

