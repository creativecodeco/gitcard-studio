import { describe, it, expect } from 'vitest';
import { escapeXml, minifySvg } from '@/utils/escape';

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

  it('should minify SVG markup by trimming spaces between tags', () => {
    const rawSvg = `
      <svg width="100" height="100">
        <g class="container">
          <text>Hello World</text>
        </g>
      </svg>
    `;
    expect(minifySvg(rawSvg)).toBe(
      '<svg width="100" height="100"><g class="container"><text>Hello World</text></g></svg>'
    );
  });
});
