import { RepoStats } from '@/domain/entities/RepoStats';
import { getTheme, getBackgroundDef, renderBrandHeader } from './theme';
import { getTranslations } from './i18n';

export function renderTopReposCard(
  repos: RepoStats[],
  themeName?: string,
  overrides?: Record<string, string>,
  username?: string
): string {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const cardWidth = 495;
  const cardHeight = 300;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  const backgroundDef = getBackgroundDef(theme, 'bg-top');

  const top4 = repos.slice(0, 4);

  const ROW_HEIGHT = 58;
  const HEADER_HEIGHT = 42;

  const repoRows = top4
    .map((repo, i) => {
      const y = HEADER_HEIGHT + i * ROW_HEIGHT;
      const desc = repo.description.length > 55 ? `${repo.description.slice(0, 52)}…` : repo.description;

      return `
      <g transform="translate(0, ${y})">
        <!-- Accent indicator bar -->
        <rect x="20" y="10" width="3" height="36" rx="1.5" fill="${theme.accent}" />

        <!-- Repo Name -->
        <text x="32" y="24" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700"
          font-size="13.5" fill="${theme.title}">${escXml(repo.name)}</text>

        <!-- Description -->
        <text x="32" y="40" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="400"
          font-size="11" fill="${theme.text}">${escXml(desc)}</text>

        <!-- Stars -->
        <g transform="translate(330, 13)">
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"
            fill="${theme.accent}" transform="scale(0.8)" />
          <text x="13" y="10" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600"
            font-size="11" fill="${theme.accent}">${formatCount(repo.stars)}</text>
        </g>

        <!-- Forks -->
        <g transform="translate(385, 13)">
          <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.803a2.25 2.25 0 0 0 1.673 2.166L5 9.153v1.597a2.25 2.25 0 1 0 1.5 0V9.153l.827-.812a2.25 2.25 0 0 0 1.673-2.166v-.803a2.25 2.25 0 1 0-1.5 0v.803a.75.75 0 0 1-.524.716L7 6.5H5l-.476.09a.75.75 0 0 1-.524-.716v-.803z"
            fill="${theme.secondary}" transform="scale(0.8)" />
          <text x="13" y="10" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600"
            font-size="11" fill="${theme.secondary}">${formatCount(repo.forks)}</text>
        </g>

        <!-- Language Dot & Name -->
        <g transform="translate(440, 13)">
          <circle cx="4" cy="5" r="4" fill="${repo.languageColor}" />
        </g>
      </g>
    `;
    })
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <title>${t.topRepos.title}</title>
      <desc>Top starred GitHub repositories card</desc>
      <defs>
        ${backgroundDef}
        <style>
          .tr-title { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
        </style>
      </defs>

      <!-- Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg-top)" />
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="none" stroke="${theme.border}" stroke-width="1" />

      <!-- Header icon -->
      <g transform="translate(22, 14)">
        <path d="M3 2.75A2.75 2.75 0 0 1 5.75 0h14.5a.75.75 0 0 1 .75.75v20.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1 0-1.5h5.25v-4H5.75A2.75 2.75 0 0 1 3 14.25v-11.5zm1.5 0v11.5c0 .69.56 1.25 1.25 1.25H20v-9.5H5.75a2.75 2.75 0 0 1-2.75-2.75c0-.69.56-1.25 1.25-1.25h12.75a.75.75 0 0 1 0 1.5H4.5z"
          fill="${theme.accent}" transform="scale(0.82)" />
      </g>
      <text x="44" y="26" class="tr-title">${t.topRepos.title}</text>
      
      <!-- Brand Logo / Subtitle -->
      ${renderBrandHeader(username || '', theme)}

      <!-- Divider -->
      <line x1="20" y1="38" x2="475" y2="38" stroke="${theme.border}" stroke-width="0.8" stroke-opacity="0.5"/>

      ${repoRows}
    </svg>
  `.trim();
}

function escXml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
