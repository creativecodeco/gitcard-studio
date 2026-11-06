import crypto from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';

const MAX_SVG_INPUT_BYTES = 512 * 1024; // 512 KB limit to prevent memory exhaustion
const MAX_PNG_CACHE_ENTRIES = 100;
const pngRenderCache = new Map<string, Buffer>();

export async function convertSvgToFormat(
  svgContent: string,
  format: string = 'svg'
): Promise<{ buffer: Buffer | string; contentType: string }> {
  const normalizedFormat = format.toLowerCase().trim();

  if (normalizedFormat === 'png') {
    if (Buffer.byteLength(svgContent, 'utf8') > MAX_SVG_INPUT_BYTES) {
      return {
        buffer: svgContent,
        contentType: 'image/svg+xml'
      };
    }

    const cacheKey = crypto.createHash('sha256').update(svgContent).digest('hex');
    const cachedPng = pngRenderCache.get(cacheKey);
    if (cachedPng) {
      return {
        buffer: cachedPng,
        contentType: 'image/png'
      };
    }

    try {
      const resvg = new Resvg(svgContent, {
        fitTo: { mode: 'zoom', value: 1.5 }
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      if (pngRenderCache.size >= MAX_PNG_CACHE_ENTRIES) {
        const oldestKey = pngRenderCache.keys().next().value;
        if (oldestKey) {
          pngRenderCache.delete(oldestKey);
        }
      }
      pngRenderCache.set(cacheKey, pngBuffer);

      return {
        buffer: pngBuffer,
        contentType: 'image/png'
      };
    } catch {
      // Fallback to SVG if PNG rendering encounters unsupported elements
      return {
        buffer: svgContent,
        contentType: 'image/svg+xml'
      };
    }
  }

  return {
    buffer: svgContent,
    contentType: 'image/svg+xml'
  };
}
