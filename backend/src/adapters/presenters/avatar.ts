import { logger } from '@/infrastructure/logging/logger';

interface CacheEntry {
  data: string;
  expiresAt: number;
}

const AVATAR_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL
const MAX_CACHE_ENTRIES = 500;
const avatarCache = new Map<string, CacheEntry>();

function cleanCache(now: number): void {
  // First, evict all expired entries
  for (const [key, entry] of avatarCache.entries()) {
    if (entry.expiresAt <= now) {
      avatarCache.delete(key);
    }
  }

  // If size still exceeds MAX_CACHE_ENTRIES, evict oldest insertion
  while (avatarCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = avatarCache.keys().next().value;
    if (oldestKey) {
      avatarCache.delete(oldestKey);
    } else {
      break;
    }
  }
}

/**
 * Fetch avatar image as Base64 to embed in SVGs without external image blocking.
 * Uses an in-memory cache with 1-hour TTL and LRU/capacity limits to optimize repeated requests.
 */
export async function fetchAvatarBase64(url: string): Promise<string> {
  if (!url) return '';

  const now = Date.now();
  const cached = avatarCache.get(url);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return '';

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

    cleanCache(now);
    avatarCache.set(url, {
      data: base64Data,
      expiresAt: now + AVATAR_CACHE_TTL_MS
    });

    return base64Data;
  } catch (e) {
    logger.warn('Failed to fetch avatar for base64 encoding', { avatarUrl: url, error: e });
    return '';
  }
}
