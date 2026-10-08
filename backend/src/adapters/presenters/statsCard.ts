import { UserStats } from '@/domain/entities/UserStats';
import { escapeXml, minifySvg } from '@/utils/escape';
import {
  getTheme,
  getBackgroundDef,
  renderBrandHeader,
  getFontFamily,
  renderGlowFilter,
  renderCardFrame
} from './theme';
import { getTranslations } from './i18n';
import { fetchAvatarBase64 } from './avatar';

// Crisp SVGs for metrics icons
const ICONS = {
  commit: `<path d="M10.8 17.6c-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6 5.6 2.5 5.6 5.6-2.5 5.6-5.6 5.6zm0-9.6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm-8.8 4h3.2v1.6H2v-1.6zm13.6 0h3.2v1.6h-3.2v-1.6z"/>`,
  star: `<path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.167L12 18.896l-7.334 3.857 1.4-8.167L.132 9.21l8.2-1.192L12 .587z"/>`,
  pr: `<path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v5.256a2.251 2.251 0 101.5 0V5.372zm11.5-2.122a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.802a2.877 2.877 0 00-.83 1.17 2.877 2.877 0 00-.182 1.096c0 .75-.297 1.488-.83 2.02l-.002.002a2.87 2.87 0 00-.829 2.02v.07a2.251 2.251 0 101.5 0v-.07a1.371 1.371 0 01.398-.966l.002-.002a4.372 4.372 0 001.261-3.076c0-.528.093-1.048.273-1.536a4.373 4.373 0 00.569-.877v-.802zM15 13.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>`,
  issue: `<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm1-15v6h-2V7h2zm0 8v2h-2v-2h2z"/>`,
  fork: `<path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.803c0 .528.093 1.048.273 1.536a4.387 4.387 0 001.42 2.138l3.11 2.333v3.197a2.251 2.251 0 101.5 0v-3.79c0-.529-.093-1.05-.273-1.538a4.387 4.387 0 00-1.42-2.137l-3.11-2.333V5.372zm6.5-2.122a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.803a4.389 4.389 0 001.693 3.447l3.11 2.333v3.197a2.251 2.251 0 101.5 0v-3.79a4.389 4.389 0 00-1.693-3.447l-3.11-2.333V5.372zM15 13.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>`,
  followers: `<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>`
};

export async function renderStatsCard(
  stats: UserStats,
  themeName?: string,
  overrides?: Record<string, string>
): Promise<string> {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const avatarBase64 = await fetchAvatarBase64(stats.avatarUrl);

  const isPrivacyMode = overrides?.hide_username === 'true';
  const isBlurAvatar = overrides?.blur_avatar === 'true';
  const fontFamily = getFontFamily(overrides?.font);

  const safeName = escapeXml(isPrivacyMode ? 'Developer' : stats.name || '');
  const safeUsername = escapeXml(isPrivacyMode ? 'developer' : stats.username || '');

  const isCompact = overrides?.layout === 'compact';
  const cardWidth = 495;
  const cardHeight = isCompact ? 130 : 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  const borderRadius = overrides?.borderRadius ? parseInt(overrides.borderRadius, 10) : 12;
  const showBorder = overrides?.showBorder !== 'false';
  const enableGlow = overrides?.glow === 'true';

  const backgroundDef = getBackgroundDef(theme, 'bg');
  const glowDef = enableGlow ? renderGlowFilter('card-glow', theme.accent) : '';

  const avatarFilterAttr = isBlurAvatar ? 'filter="url(#avatar-blur)"' : '';
  const avatarBlurDef = isBlurAvatar
    ? `<filter id="avatar-blur"><feGaussianBlur stdDeviation="4" /></filter>`
    : '';

  // Avatar SVG element
  const avatarSvg = avatarBase64
    ? `<image href="${avatarBase64}" x="25" y="${isCompact ? '15' : '25'}" width="${isCompact ? '50' : '70'}" height="${isCompact ? '50' : '70'}" clip-path="url(#circle-clip)" ${avatarFilterAttr} />`
    : `<circle cx="60" cy="${isCompact ? '40' : '60'}" r="${isCompact ? '25' : '35'}" fill="${theme.secondary}" opacity="0.3" ${avatarFilterAttr}/>
       <path d="M60 45a10 10 0 100 20 10 10 0 000-20zm0 25c-11.5 0-21 5.2-21 12v3h42v-3c0-6.8-9.5-12-21-12z" fill="${theme.text}" />`;

  // Parse hidden metrics
  const hiddenItems = new Set(
    (overrides?.hide || '')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const allMetrics = [
    { key: 'commits', label: t.stats.commits, value: stats.totalCommits, icon: ICONS.commit },
    { key: 'stars', label: t.stats.stars, value: stats.totalStars, icon: ICONS.star, glow: true },
    { key: 'followers', label: t.stats.followers, value: stats.followers, icon: ICONS.followers },
    { key: 'prs', label: t.stats.prs, value: stats.totalPRs, icon: ICONS.pr },
    { key: 'issues', label: t.stats.issues, value: stats.totalIssues, icon: ICONS.issue },
    { key: 'forks', label: t.stats.forks, value: stats.forksReceived, icon: ICONS.fork }
  ];

  const visibleMetrics = allMetrics.filter((m) => !hiddenItems.has(m.key));

  // Render metrics grid dynamically based on visible count
  const itemsPerRow = isCompact ? 3 : 3;
  const metricItemsSvg: string[] = [];

  visibleMetrics.forEach((m, idx) => {
    const row = Math.floor(idx / itemsPerRow);
    const col = idx % itemsPerRow;
    const posX = col * 150;
    const posY = isCompact ? row * 26 : row * 30;

    metricItemsSvg.push(`
      <g transform="translate(${posX}, ${posY})">
        <svg class="stat-icon ${m.glow && enableGlow ? 'glow' : ''}" viewBox="0 0 24 24" width="18" height="18" x="0" y="0">
          ${m.icon}
        </svg>
        <text x="24" y="14" class="label">${m.label}</text>
        <text x="105" y="14" class="value">${m.value}</text>
      </g>
    `);
  });

  const cardFrame = renderCardFrame({
    width: cardWidth,
    height: cardHeight,
    theme,
    borderRadius,
    showBorder
  });

  return minifySvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <title>${safeName} - GitHub Stats</title>
      <desc>GitHub Profile Statistics card for ${safeUsername}</desc>
      <defs>
        ${backgroundDef}
        ${glowDef}
        ${avatarBlurDef}
        <clipPath id="circle-clip">
          <circle cx="60" cy="${isCompact ? '40' : '60'}" r="${isCompact ? '25' : '35'}" />
        </clipPath>
        <style>
          .title { font-family: ${fontFamily}; font-weight: 700; font-size: ${isCompact ? '16px' : '18px'}; fill: ${theme.title}; }
          .username { font-family: ${fontFamily}; font-weight: 400; font-size: 13px; fill: ${theme.secondary}; }
          .label { font-family: ${fontFamily}; font-weight: 500; font-size: 13.5px; fill: ${theme.text}; }
          .value { font-family: ${fontFamily}; font-weight: 700; font-size: 14px; fill: ${theme.accent}; }
          .stat-icon { fill: ${theme.accent}; }
          .glow { filter: url(#card-glow); }
        </style>
      </defs>

      <!-- Card Background Frame -->
      ${cardFrame}

      <!-- Avatar & Name -->
      <g transform="translate(0, 0)">
        ${avatarSvg}
        <text x="${isCompact ? '90' : '110'}" y="${isCompact ? '38' : '55'}" class="title">${safeName}</text>
        <text x="${isCompact ? '90' : '110'}" y="${isCompact ? '54' : '73'}" class="username">@${safeUsername}</text>
      </g>

      <!-- Decorative Divider -->
      <line x1="25" y1="${isCompact ? '75' : '110'}" x2="470" y2="${isCompact ? '75' : '110'}" stroke="${theme.border}" stroke-dasharray="2, 2" stroke-width="1" />

      <!-- Statistics Grid -->
      <g transform="translate(25, ${isCompact ? '88' : '125'})">
        ${metricItemsSvg.join('\n')}
      </g>
      
      <!-- Brand Logo / Subtitle -->
      ${renderBrandHeader(isPrivacyMode ? '' : stats.username, theme, 470, isCompact ? 20 : 25)}
    </svg>
  `);
}
