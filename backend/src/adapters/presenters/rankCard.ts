import { UserStats } from '@/domain/entities/UserStats';
import {
  getTheme,
  getBackgroundDef,
  renderBrandHeader,
  renderCardFrame,
  renderGlowFilter,
  renderAnimationStyles
} from './theme';
import { getTranslations } from './i18n';
import { escapeXml } from '@/utils/escape';

export function renderRankCard(
  stats: UserStats,
  themeName?: string,
  overrides?: Record<string, string>
): string {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const cardWidth = 495;
  const cardHeight = 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  const fontFamily = overrides?.font
    ? `${overrides.font}, 'Segoe UI', Ubuntu, sans-serif`
    : "'Segoe UI', Ubuntu, sans-serif";

  const glow = overrides?.glow === '1' || overrides?.glow === 'true';
  const glowFilterDef = glow ? renderGlowFilter('glow-rank', theme.accent) : '';
  const filterAttr = glow ? 'filter="url(#glow-rank)"' : '';

  const backgroundDef = getBackgroundDef(theme, 'bg-rank');
  const animStyles = renderAnimationStyles(overrides?.animation);
  const animClass = overrides?.animation ? 'pulse-anim' : '';

  const colBarWidth = 280;
  const rawCollab = Number(stats?.collaborationIndex);
  const collabIndex = !Number.isNaN(rawCollab) ? Math.min(100, Math.max(0, rawCollab)) : 0;
  const filledWidth = Math.round((collabIndex / 100) * colBarWidth);

  const safeName = escapeXml(stats?.name || stats?.username || 'Developer');
  const safeUsername = escapeXml(stats?.username || 'user');
  const safeRank = escapeXml(stats?.rank || 'B');

  let rankDesc = t.rank.rankGrowing;
  if (safeRank === 'S+' || safeRank === 'S') {
    rankDesc = t.rank.rankLegendary;
  } else if (safeRank === 'A+' || safeRank === 'A') {
    rankDesc = t.rank.rankOutstanding;
  } else if (safeRank === 'B+' || safeRank === 'B') {
    rankDesc = t.rank.rankActive;
  }
  const safeRankDesc = escapeXml(rankDesc);

  const borderRadius = overrides?.borderRadius ? Number.parseInt(overrides.borderRadius, 10) : 12;
  const showBorder = overrides?.showBorder !== 'false';
  const borderColor = overrides?.borderColor;

  const cardFrame = renderCardFrame({
    width: cardWidth,
    height: cardHeight,
    theme,
    gradientId: 'bg-rank',
    borderRadius,
    showBorder,
    borderColor
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <title>${safeName} - GitHub Rank ${safeRank}</title>
      <desc>GitHub Rank and Collaboration Index card for ${safeName}</desc>
      <defs>
        ${backgroundDef}
        ${glowFilterDef}
        <style>
          ${animStyles}
          .rank-val { font-family: ${fontFamily}; font-weight: 900; font-size: 38px; fill: ${theme.accent}; }
          .rank-lbl { font-family: ${fontFamily}; font-weight: 500; font-size: 11px; fill: ${theme.secondary}; letter-spacing: 1.5px; }
          .title { font-family: ${fontFamily}; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
          .subtitle { font-family: ${fontFamily}; font-weight: 400; font-size: 11.5px; fill: ${theme.secondary}; }
          .metric-lbl { font-family: ${fontFamily}; font-weight: 600; font-size: 12px; fill: ${theme.text}; }
          .metric-val { font-family: ${fontFamily}; font-weight: 700; font-size: 13px; fill: ${theme.accent}; }
          .bar-bg { fill: ${theme.border}; opacity: 0.5; }
          .bar-fill { fill: ${theme.accent}; }
        </style>
      </defs>

      <!-- Card Background -->
      <g ${filterAttr}>
        ${cardFrame}
      </g>

      <!-- Left Section: Rank Badge -->
      <g transform="translate(25, 48)" class="${animClass}">
        <rect width="100" height="100" rx="16" fill="${theme.accent}10" stroke="${theme.accent}" stroke-width="2" />
        <text x="50" y="38" text-anchor="middle" class="rank-lbl">RANK</text>
        <text x="50" y="78" text-anchor="middle" class="rank-val">${safeRank}</text>
      </g>

      <!-- Right Section: Details -->
      <g transform="translate(150, 52)">
        <text x="0" y="10" class="title">${escapeXml(t.rank.title)}</text>
        <text x="0" y="28" class="subtitle">${safeRankDesc}</text>
        
        <!-- Collaboration Progress Bar -->
        <g transform="translate(0, 48)">
          <text x="0" y="12" class="metric-lbl">${escapeXml(t.rank.collab)}</text>
          <text x="280" y="12" text-anchor="end" class="metric-val">${collabIndex}%</text>
          
          <!-- Bar container -->
          <rect x="0" y="20" width="${colBarWidth}" height="8" rx="4" class="bar-bg" />
          <rect x="0" y="20" width="${filledWidth}" height="8" rx="4" class="bar-fill" />
        </g>
      </g>

      <!-- Brand Logo / Subtitle -->
      ${renderBrandHeader(safeUsername, theme)}
    </svg>
  `.trim();
}
