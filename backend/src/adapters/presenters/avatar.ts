import { logger } from '@/infrastructure/logging/logger';

interface CacheEntry {
  data: string;
  expiresAt: number;
}

const AVATAR_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL
const MAX_CACHE_ENTRIES = 500;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB limit
const SAFE_IMAGE_MIME_REGEX = /^image\/(?:png|jpe?g|gif|webp|avif)$/i;
const avatarCache = new Map<string, CacheEntry>();

/**
 * Validates that an avatar URL uses HTTPS and does not target internal/private/loopback networks (SSRF prevention).
 */
export function validateAvatarUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!host) return false;

    // Block localhost, loopback, link-local, cloud metadata, and internal TLD hostnames
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '::' ||
      host.startsWith('fe80:') ||
      host.startsWith('fc00:') ||
      host.startsWith('fd00:')
    ) {
      return false;
    }

    // Block private/reserved IPv4 ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

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
  if (!validateAvatarUrl(url)) return '';

  const now = Date.now();
  const cached = avatarCache.get(url);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const res = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) return '';

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_AVATAR_BYTES) return '';

    const buffer = Buffer.from(arrayBuffer);
    const rawContentType = (res.headers.get('content-type') || '').split(';')[0].trim();
    const mimeType = SAFE_IMAGE_MIME_REGEX.test(rawContentType) ? rawContentType : 'image/jpeg';
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
