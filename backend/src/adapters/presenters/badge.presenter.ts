import { escapeXml } from '@/utils/escape';

export interface BadgeOptions {
  label?: string;
  value: string | number;
  labelColor?: string;
  valueColor?: string;
  style?: 'flat' | 'plastic';
}

export function renderBadgeSVG(options: BadgeOptions): string {
  const label = escapeXml(options.label || 'github helpers');
  const rawValue = String(options.value);
  const value = escapeXml(rawValue);

  const labelBg = options.labelColor || '#555555';
  const valueBg = options.valueColor || '#38bdf8';

  // Calculate approximate text widths for crisp rendering
  const labelWidth = Math.max(30, label.length * 6.5 + 16);
  const valueWidth = Math.max(30, value.length * 7 + 16);
  const totalWidth = Math.round(labelWidth + valueWidth);

  const labelX = Math.round(labelWidth / 2);
  const valueX = Math.round(labelWidth + valueWidth / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="${labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${valueBg}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text x="${labelX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${Math.max(10, (labelWidth - 12) * 10)}">${label}</text>
    <text x="${labelX * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${Math.max(10, (labelWidth - 12) * 10)}">${label}</text>
    <text x="${valueX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${Math.max(10, (valueWidth - 12) * 10)}">${value}</text>
    <text x="${valueX * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${Math.max(10, (valueWidth - 12) * 10)}">${value}</text>
  </g>
</svg>`;
}
