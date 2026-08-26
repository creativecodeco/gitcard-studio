import Redis, { RedisOptions } from 'ioredis';
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
    const cleanPattern = pattern.replaceAll('*', '');
    for (const k of this.store.keys()) {
      if (k.includes(cleanPattern)) {
        this.store.delete(k);
      }
    }
  }
}

export class RedisCacheAdapter implements CacheStore {
  private readonly fallback = new MemoryCacheAdapter();
  private readonly client: Redis | null = null;
  private isConnected = false;

  constructor() {
    const redisHost = process.env.REDIS_HOST;
    const redisUrl = process.env.REDIS_URL;

    if (redisHost || redisUrl) {
      try {
        const options: RedisOptions = {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 100, 1000);
          }
        };

        if (process.env.REDIS_PORT) {
          options.port = parseInt(process.env.REDIS_PORT, 10);
        }
        if (process.env.REDIS_PASSWORD) {
          options.password = process.env.REDIS_PASSWORD;
        }
        if (process.env.REDIS_DB) {
          options.db = parseInt(process.env.REDIS_DB, 10);
        }

        this.client = redisUrl
          ? new Redis(redisUrl, options)
          : new Redis(redisHost ?? 'localhost', options);

        this.client.on('connect', () => {
          this.isConnected = true;
          logger.info('Connected to Redis cache server successfully.');
        });

        this.client.on('error', (err) => {
          if (this.isConnected) {
            logger.warn(`Redis connection error, falling back to memory cache: ${err.message}`);
          }
          this.isConnected = false;
        });

        // Attempt non-blocking initial connection
        this.client.connect().catch((err) => {
          this.isConnected = false;
          logger.warn(
            `Initial Redis connection skipped, using memory cache fallback: ${err.message}`
          );
        });
      } catch (err) {
        this.client = null;
        this.isConnected = false;
        logger.warn(
          `Failed to initialize Redis client, defaulting to memory cache: ${(err as Error).message}`
        );
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client && this.isConnected) {
      try {
        const data = await this.client.get(key);
        if (data !== null) {
          return JSON.parse(data) as T;
        }
      } catch {
        this.isConnected = false;
      }
    }
    return this.fallback.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 7200): Promise<void> {
    await this.fallback.set(key, value, ttlSeconds);

    if (this.client && this.isConnected) {
      try {
        const serialized = JSON.stringify(value);
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } catch {
        this.isConnected = false;
      }
    }
  }

  async del(key: string): Promise<void> {
    await this.fallback.del(key);

    if (this.client && this.isConnected) {
      try {
        await this.client.del(key);
      } catch {
        this.isConnected = false;
      }
    }
    logger.info(`Invalidated cache for key: ${key}`, { key });
  }

  async flushPattern(pattern: string): Promise<void> {
    await this.fallback.flushPattern(pattern);

    if (this.client && this.isConnected) {
      try {
        const searchPattern = pattern.includes('*') ? pattern : `*${pattern}*`;
        const keys = await this.client.keys(searchPattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch {
        this.isConnected = false;
      }
    }
    logger.info(`Invalidated cache pattern: ${pattern}`, { pattern });
  }
}
