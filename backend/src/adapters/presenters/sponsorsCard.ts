import { SponsorStats } from '@/domain/entities/SponsorStats';
import { getTheme, getBackgroundDef, renderBrandHeader } from './theme';
import { getTranslations } from './i18n';
import { fetchAvatarBase64 } from './avatar';

const HEART_ICON = `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`;

export async function renderSponsorsCard(
  stats: SponsorStats,
  themeName?: string,
  overrides?: Record<string, string>
): Promise<string> {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const avatarBase64 = await fetchAvatarBase64(stats.avatarUrl);

  const cardWidth = 495;
  const cardHeight = 220;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;
  const backgroundDef = getBackgroundDef(theme, 'bg');

  const mainAvatarSvg = avatarBase64
    ? `<image href="${avatarBase64}" x="25" y="25" width="60" height="60" clip-path="url(#circle-clip-main)" />`
    : `<circle cx="55" cy="55" r="30" fill="${theme.secondary}" opacity="0.3"/>
       <path d="M55 42a9 9 0 100 18 9 9 0 000-18zm0 22c-10 0-18 4.5-18 10v2h36v-2c0-5.5-8-10-18-10z" fill="${theme.text}" />`;

  // Process sponsors avatars in parallel (up to 12)
  const displaySponsors = stats.sponsors.slice(0, 12);
  const sponsorAvatars = await Promise.all(
    displaySponsors.map(async (sp) => {
      const b64 = await fetchAvatarBase64(sp.avatarUrl);
      return { ...sp, b64 };
    })
  );

  let sponsorsContent: string;
  if (sponsorAvatars.length > 0) {
    const avatarItems = sponsorAvatars
      .map((sp, idx) => {
        const col = idx % 6;
        const row = Math.floor(idx / 6);
        const x = 30 + col * 72;
        const y = 145 + row * 34;
        const clipId = `clip-sp-${idx}`;

        const img = sp.b64
          ? `<image href="${sp.b64}" x="${x}" y="${y}" width="26" height="26" clip-path="url(#${clipId})" />`
          : `<circle cx="${x + 13}" cy="${y + 13}" r="13" fill="${theme.secondary}" opacity="0.4" />`;

        const displayName = sp.name.length > 14 ? `${sp.name.slice(0, 13)}…` : sp.name;

        return `
          <g>
            <clipPath id="${clipId}">
              <circle cx="${x + 13}" cy="${y + 13}" r="13" />
            </clipPath>
            ${img}
            <text x="${x + 32}" y="${y + 17}" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-size="11px" font-weight="600" fill="${theme.text}">
              ${displayName}
            </text>
          </g>
        `;
      })
      .join('');

    sponsorsContent = `<g>${avatarItems}</g>`;
  } else {
    sponsorsContent = `
      <g transform="translate(25, 140)">
        <rect width="445" height="55" rx="8" fill="${theme.secondary}15" stroke="${theme.border}" stroke-width="1" stroke-dasharray="3, 3" />
        <svg fill="#ea4aaa" viewBox="0 0 24 24" width="20" height="20" x="20" y="17.5">
          ${HEART_ICON}
        </svg>
        <text x="50" y="27" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-size="12.5px" font-weight="600" fill="${theme.text}">
          ${t.sponsors.noSponsors}
        </text>
        <text x="50" y="42" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-size="11px" fill="${theme.secondary}">
          https://github.com/sponsors/${stats.username}
        </text>
      </g>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <title>${stats.name} - GitHub Sponsors</title>
      <desc>GitHub Sponsors card for ${stats.name}</desc>
      <defs>
        ${backgroundDef}
        <clipPath id="circle-clip-main">
          <circle cx="55" cy="55" r="30" />
        </clipPath>
        <style>
          .title { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
          .username { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 400; font-size: 12.5px; fill: ${theme.secondary}; }
          .label { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 500; font-size: 12px; fill: ${theme.text}; }
          .value { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 700; font-size: 13.5px; fill: ${theme.accent}; }
          .heart-icon { fill: #ea4aaa; filter: drop-shadow(0px 0px 4px #ea4aaa66); }
        </style>
      </defs>

      <!-- Card Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg)" stroke="${theme.border}" stroke-width="1.5" />

      <!-- Maintainer Header -->
      <g>
        ${mainAvatarSvg}
        <text x="95" y="48" class="title">${stats.name}</text>
        <text x="95" y="66" class="username">@${stats.username}</text>
        
        <!-- Sponsor Badge Header -->
        <g transform="translate(340, 48)">
          <rect width="130" height="24" rx="12" fill="#ea4aaa22" stroke="#ea4aaa88" stroke-width="1" />
          <svg class="heart-icon" viewBox="0 0 24 24" width="14" height="14" x="8" y="5">
            ${HEART_ICON}
          </svg>
          <text x="28" y="16" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-weight="700" font-size="11px" fill="#ea4aaa">
            ${t.sponsors.title}
          </text>
        </g>
      </g>

      <!-- Brand Logo / Subtitle -->
      ${renderBrandHeader(stats.username, theme)}

      <!-- Stats Bar Line -->
      <line x1="25" y1="95" x2="470" y2="95" stroke="${theme.border}" stroke-dasharray="2, 2" stroke-width="1" />

      <!-- Summary Metrics Grid -->
      <g transform="translate(25, 112)">
        <!-- Total Sponsors -->
        <g transform="translate(0, 0)">
          <text x="0" y="10" class="label">${t.sponsors.total}</text>
          <text x="95" y="10" class="value">${stats.totalSponsorsCount}</text>
        </g>

        <!-- Monthly -->
        <g transform="translate(140, 0)">
          <text x="0" y="10" class="label">${t.sponsors.monthly}</text>
          <text x="65" y="10" class="value">${stats.monthlySponsorsCount}</text>
        </g>

        <!-- One-time -->
        <g transform="translate(250, 0)">
          <text x="0" y="10" class="label">${t.sponsors.oneTime}</text>
          <text x="75" y="10" class="value">${stats.oneTimeSponsorsCount}</text>
        </g>

        <!-- Est. Monthly Dollars -->
        <g transform="translate(370, 0)">
          <text x="0" y="10" class="label">${t.sponsors.estMonthly}</text>
          <text x="80" y="10" class="value">$${stats.totalMonthlyEstimatedDollars}</text>
        </g>
      </g>

      <!-- Sponsors Section -->
      ${sponsorsContent}
    </svg>
  `.trim();
}
