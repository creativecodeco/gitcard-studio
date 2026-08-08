import { getTheme, renderBrandHeader, type Theme } from './theme';
import { escapeXml } from '../../utils/escape';

export interface TimelinePeriod {
  key: 'morning' | 'afternoon' | 'evening' | 'night';
  commits: number;
}

export interface TimelineMatrixData {
  username: string;
  periods?: TimelinePeriod[];
}

export interface TimelineMatrixCardOptions {
  theme?: string;
  cardWidth?: string;
  locale?: string;
  overrides?: Record<string, string>;
}

export function renderTimelineMatrixCard(
  data: TimelineMatrixData,
  options: TimelineMatrixCardOptions = {}
): string {
  const theme: Theme = getTheme(options.theme, options.overrides);
  const isEn = options.locale === 'en';
  const username = escapeXml(data.username || 'octocat');
  const cardWidth = options.cardWidth === '100%' ? '100%' : '495';
  const viewBoxWidth = 495;
  const viewBoxHeight = 190;

  const periods = data.periods || [
    { key: 'morning', commits: 45 },
    { key: 'afternoon', commits: 80 },
    { key: 'evening', commits: 60 },
    { key: 'night', commits: 15 }
  ];

  const total = periods.reduce((sum, p) => sum + p.commits, 0) || 1;

  const periodLabels: Record<string, { titleEs: string; titleEn: string; icon: string }> = {
    morning: { titleEs: 'Mañana (06h - 12h)', titleEn: 'Morning (06h - 12h)', icon: '🌅' },
    afternoon: { titleEs: 'Tarde (12h - 18h)', titleEn: 'Afternoon (12h - 18h)', icon: '☀️' },
    evening: { titleEs: 'Noche (18h - 00h)', titleEn: 'Evening (18h - 00h)', icon: '🌆' },
    night: { titleEs: 'Madrugada (00h - 06h)', titleEn: 'Night (00h - 06h)', icon: '🌙' }
  };

  const titleText = isEn ? 'Coding Productivity Timeline' : 'Línea de Tiempo de Productividad';
  const brandHeader = renderBrandHeader(username, theme, 470, 24);

  let periodBarsSvg = '';
  const startY = 55;
  const barHeight = 22;
  const gap = 8;
  const maxBarWidth = 260;

  periods.forEach((p, idx) => {
    const meta = periodLabels[p.key] || periodLabels.morning;
    const label = isEn ? meta.titleEn : meta.titleEs;
    const pct = Math.round((p.commits / total) * 100);
    const fillWidth = Math.max(8, Math.round((p.commits / total) * maxBarWidth));
    const y = startY + idx * (barHeight + gap);

    periodBarsSvg += `<g transform="translate(25, ${y})">
      <text x="0" y="15" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11px" font-weight="500" fill="${theme.text}">${meta.icon} ${escapeXml(label)}</text>
      <rect x="180" y="3" width="${maxBarWidth}" height="${barHeight - 6}" rx="4" fill="${theme.border}" fill-opacity="0.3" />
      <rect x="180" y="3" width="${fillWidth}" height="${barHeight - 6}" rx="4" fill="${theme.accent}" fill-opacity="0.85" />
      <text x="${180 + maxBarWidth + 10}" y="15" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11px" font-weight="600" fill="${theme.accent}">${pct}%</text>
    </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${viewBoxHeight}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" fill="none">
  <style>
    .card-bg { fill: ${theme.bg}; stroke: ${theme.border}; stroke-width: 1px; rx: 10px; }
    .title { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 14px; fill: ${theme.title}; }
  </style>

  <rect width="${viewBoxWidth}" height="${viewBoxHeight}" class="card-bg" />
  ${brandHeader}

  <!-- Header Title -->
  <text x="25" y="32" class="title">${escapeXml(titleText)}</text>

  <!-- Period Progress Bars -->
  ${periodBarsSvg}
</svg>`;
}
