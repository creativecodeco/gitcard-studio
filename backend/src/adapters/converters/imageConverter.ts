import { Resvg } from '@resvg/resvg-js';

export async function convertSvgToFormat(
  svgContent: string,
  format: string = 'svg'
): Promise<{ buffer: Buffer | string; contentType: string }> {
  const normalizedFormat = format.toLowerCase().trim();

  if (normalizedFormat === 'png') {
    try {
      const resvg = new Resvg(svgContent, {
        fitTo: { mode: 'zoom', value: 1.5 }
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();
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
