import { getTheme, renderBrandHeader, type Theme } from './theme';
import { escapeXml } from '../../utils/escape';

export interface CommitActivityData {
  username: string;
  totalCommitsThisYear?: number;
  /** 7 days (0: Sun to 6: Sat) x 24 hours (0-23) commit count matrix */
  hourlyMatrix?: number[][];
}

export interface CommitActivityCardOptions {
  theme?: string;
  cardWidth?: string;
  locale?: string;
  overrides?: Record<string, string>;
}

export function renderCommitActivityCard(
  data: CommitActivityData,
  options: CommitActivityCardOptions = {}
): string {
  const theme: Theme = getTheme(options.theme, options.overrides);
  const isEn = options.locale === 'en';

  const username = escapeXml(data.username || 'octocat');
  const cardWidth = options.cardWidth === '100%' ? '100%' : '495';
  const viewBoxWidth = 495;
  const viewBoxHeight = 215;

  // Build matrix or default mock matrix if none provided
  const matrix = data.hourlyMatrix || Array.from({ length: 7 }, () => Array(24).fill(0));

  // Determine Peak Productivity Persona (Night Owl vs Early Bird)
  let nightCommits = 0; // 18:00 - 03:59
  let dayCommits = 0;   // 04:00 - 17:59

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const count = matrix[d]?.[h] || 0;
      if (h >= 18 || h < 4) {
        nightCommits += count;
      } else {
        dayCommits += count;
      }
    }
  }

  const isNightOwl = nightCommits >= dayCommits;
  const personaBadge = isNightOwl
    ? (isEn ? '🦉 Night Owl' : '🦉 Búho Nocturno')
    : (isEn ? '🌅 Early Bird' : '🌅 Madrugador');

  const titleText = isEn
    ? `Commit Activity Matrix`
    : `Matriz de Hábitos de Commit`;

  const brandHeader = renderBrandHeader(username, theme, 470, 24);

  // Days labels (Mon - Sun)
  const dayLabels = isEn
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Hours labels (every 4 hours)
  const hourLabels = ['00h', '04h', '08h', '12h', '16h', '20h'];

  // Heatmap Grid Dimensions
  const startX = 45;
  const startY = 80;
  const cellWidth = 16;
  const cellHeight = 12;
  const cellGap = 3;

  let gridSvg = '';

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const y = startY + dayIdx * (cellHeight + cellGap);
    const dayLabel = dayLabels[dayIdx];

    // Day label text
    gridSvg += `<text x="${startX - 8}" y="${y + cellHeight - 2}" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="9px" fill="${theme.secondary}">${dayLabel}</text>`;

    for (let hourIdx = 0; hourIdx < 24; hourIdx++) {
      const x = startX + hourIdx * (cellWidth + cellGap);
      const val = matrix[dayIdx]?.[hourIdx] || 0;

      // Color intensity
      let color = theme.bg;
      let opacity = 0.2;

      if (val > 0) {
        if (val === 1) { color = theme.accent; opacity = 0.4; }
        else if (val === 2) { color = theme.accent; opacity = 0.65; }
        else if (val === 3) { color = theme.accent; opacity = 0.85; }
        else { color = theme.accent; opacity = 1.0; }
      }

      gridSvg += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="2" fill="${color}" fill-opacity="${opacity}" stroke="${theme.border}" stroke-width="0.5"><title>${dayLabel} ${hourIdx}:00 - ${val} commits</title></rect>`;
    }
  }

  // Render Hour Labels below grid
  for (let i = 0; i < hourLabels.length; i++) {
    const hourLabel = hourLabels[i];
    const hourVal = i * 4;
    const x = startX + hourVal * (cellWidth + cellGap) + cellWidth / 2;
    gridSvg += `<text x="${x}" y="${startY + 7 * (cellHeight + cellGap) + 12}" text-anchor="middle" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="9px" fill="${theme.secondary}">${hourLabel}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${viewBoxHeight}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" fill="none">
  <style>
    .card-bg { fill: ${theme.bg}; stroke: ${theme.border}; stroke-width: 1px; rx: 10px; }
    .title { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 14px; fill: ${theme.title}; }
    .persona-badge { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.accent}; }
  </style>

  <rect width="${viewBoxWidth}" height="${viewBoxHeight}" class="card-bg" />
  ${brandHeader}

  <!-- Header Title -->
  <text x="25" y="32" class="title">${escapeXml(titleText)}</text>

  <!-- Productivity Persona Badge -->
  <g transform="translate(25, 42)">
    <rect x="0" y="0" width="130" height="20" rx="10" fill="${theme.accent}" fill-opacity="0.15" stroke="${theme.accent}" stroke-width="0.8" />
    <text x="65" y="14" text-anchor="middle" class="persona-badge">${escapeXml(personaBadge)}</text>
  </g>

  <!-- Heatmap Grid -->
  ${gridSvg}
</svg>`;
}
