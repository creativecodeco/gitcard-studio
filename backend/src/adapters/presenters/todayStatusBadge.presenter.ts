import { getTheme, renderBrandHeader, type Theme } from './theme';
import { escapeXml } from '../../utils/escape';

export interface TodayStatusData {
  username: string;
  commitsToday: number;
}

export interface TodayStatusCardOptions {
  theme?: string;
  locale?: string;
  overrides?: Record<string, string>;
}

export function renderTodayStatusBadge(
  data: TodayStatusData,
  options: TodayStatusCardOptions = {}
): string {
  const theme: Theme = getTheme(options.theme, options.overrides);
  const isEn = options.locale === 'en';
  const username = escapeXml(data.username || 'octocat');
  const count = data.commitsToday || 0;

  const isActive = count > 0;
  let statusText = '';
  if (isActive) {
    statusText = isEn
      ? `Active Today • ${count} commit${count === 1 ? '' : 's'}`
      : `Activo hoy • ${count} commit${count === 1 ? '' : 's'}`;
  } else {
    statusText = isEn ? 'Resting Today' : 'Descansando hoy';
  }

  const iconEmoji = isActive ? '🔥' : '💤';
  const badgeText = `${iconEmoji} ${statusText}`;

  const width = 340;
  const height = 48;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <style>
    .bg { fill: ${theme.bg}; stroke: ${theme.border}; stroke-width: 1px; rx: 8px; }
    .status-text { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 13px; fill: ${isActive ? theme.title : theme.secondary}; }
  </style>

  <rect width="${width}" height="${height}" class="bg" />
  <circle cx="24" cy="24" r="8" fill="${isActive ? theme.accent : theme.secondary}" fill-opacity="0.2" />
  <circle cx="24" cy="24" r="4" fill="${isActive ? theme.accent : theme.secondary}" />

  <text x="42" y="29" class="status-text">${escapeXml(badgeText)}</text>
  ${renderBrandHeader(username, theme, width - 15, 29)}
</svg>`;
}
