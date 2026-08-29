import { describe, it, expect } from 'vitest';
import { escapeXml } from '@/utils/escape';

describe('utils/escape.ts', () => {
  it('should escape special XML characters correctly', () => {
    expect(escapeXml('<script>alert("XSS & test\'s")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS &amp; test&apos;s&quot;)&lt;/script&gt;'
    );
  });

  it('should return non-string inputs as safe string', () => {
    expect(escapeXml(12345)).toBe('12345');
    expect(escapeXml(null)).toBe('');
    expect(escapeXml(undefined)).toBe('');
    expect(escapeXml(true)).toBe('true');
  });

  it('should leave strings without special characters untouched', () => {
    expect(escapeXml('hello-world_123')).toBe('hello-world_123');
  });
});
