import { describe, it, expect } from 'vitest';
import { convertSvgToFormat } from '@/adapters/converters/imageConverter';

describe('Image Converter Adapter', () => {
  const sampleSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="blue"/></svg>';

  it('should return SVG string and image/svg+xml content type by default', async () => {
    const res = await convertSvgToFormat(sampleSvg, 'svg');
    expect(res.contentType).toBe('image/svg+xml');
    expect(res.buffer).toBe(sampleSvg);
  });

  it('should convert SVG to PNG buffer when format=png', async () => {
    const res = await convertSvgToFormat(sampleSvg, 'png');
    expect(res.contentType).toBe('image/png');
    expect(Buffer.isBuffer(res.buffer)).toBe(true);
    expect((res.buffer as Buffer).length).toBeGreaterThan(0);
  });
});
