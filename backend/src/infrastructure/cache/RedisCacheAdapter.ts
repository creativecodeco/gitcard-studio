import { logger } from '../logging/logger';

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  flushPattern(pattern: string): Promise<void>;
}

export class MemoryCacheAdapter implements CacheStore {
  private readonly store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 7200): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async flushPattern(pattern: string): Promise<void> {
    const cleanPattern = pattern.replace('*', '');
    for (const k of this.store.keys()) {
      if (k.includes(cleanPattern)) {
        this.store.delete(k);
      }
    }
  }
}

export class RedisCacheAdapter implements CacheStore {
  private readonly fallback = new MemoryCacheAdapter();

  async get<T>(key: string): Promise<T | null> {
    return this.fallback.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 7200): Promise<void> {
    await this.fallback.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.fallback.del(key);
    logger.info(`Invalidated cache for key: ${key}`, { key });
  }

  async flushPattern(pattern: string): Promise<void> {
    await this.fallback.flushPattern(pattern);
    logger.info(`Invalidated cache pattern: ${pattern}`, { pattern });
  }
}
