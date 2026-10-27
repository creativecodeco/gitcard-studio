import { RepoStats } from '@/domain/entities/RepoStats';
import { escapeXml, minifySvg } from '@/utils/escape';
import { getTheme, getBackgroundDef, renderBrandHeader } from './theme';

const ICONS = {
  repo: `<path d="M3 2.75A2.75 2.75 0 0 1 5.75 0h14.5a.75.75 0 0 1 .75.75v20.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1 0-1.5h5.25v-4H5.75A2.75 2.75 0 0 1 3 14.25v-11.5zm1.5 0v11.5c0 .69.56 1.25 1.25 1.25H20v-9.5H5.75a2.75 2.75 0 0 1-2.75-2.75c0-.69.56-1.25 1.25-1.25h12.75a.75.75 0 0 1 0 1.5H4.5z"/>`,
  eye: `<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>`,
  star: `<path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.167L12 18.896l-7.334 3.857 1.4-8.167L.132 9.21l8.2-1.192L12 .587z"/>`,
  fork: `<path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.803c0 .528.093 1.048.273 1.536a4.387 4.387 0 001.42 2.138l3.11 2.333v3.197a2.251 2.251 0 101.5 0v-3.79c0-.529-.093-1.05-.273-1.538a4.387 4.387 0 00-1.42-2.137l-3.11-2.333V5.372zm6.5-2.122a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.803a4.389 4.389 0 001.693 3.447l3.11 2.333v3.197a2.251 2.251 0 101.5 0v-3.79a4.389 4.389 0 00-1.693-3.447l-3.11-2.333V5.372zM15 13.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>`
};

interface RepoViewsLocaleText {
  viewsLabel: string;
  liveTracking: string;
  starsLabel: string;
  forksLabel: string;
}

const REPO_VIEWS_I18N: Record<string, RepoViewsLocaleText> = {
  es: {
    viewsLabel: 'Visitas del Proyecto',
    liveTracking: 'Tráfico del repositorio en tiempo real',
    starsLabel: 'Estrellas:',
    forksLabel: 'Forks:'
  },
  en: {
    viewsLabel: 'Project Views',
    liveTracking: 'Real-time repository traffic',
    starsLabel: 'Stars:',
    forksLabel: 'Forks:'
  },
  fr: {
    viewsLabel: 'Visites du Projet',
    liveTracking: 'Trafic du dépôt en temps réel',
    starsLabel: 'Étoiles:',
    forksLabel: 'Forks:'
  },
  de: {
    viewsLabel: 'Projekt-Aufrufe',
    liveTracking: 'Echtzeit-Repository-Traffic',
    starsLabel: 'Sterne:',
    forksLabel: 'Forks:'
  },
  pt: {
    viewsLabel: 'Visitas do Projeto',
    liveTracking: 'Tráfego do repositório em tempo real',
    starsLabel: 'Estrelas:',
    forksLabel: 'Forks:'
  },
  ja: {
    viewsLabel: 'プロジェクト閲覧数',
    liveTracking: 'リアルタイムリポジトリトラフィック',
    starsLabel: 'スター:',
    forksLabel: 'フォーク:'
  },
  zh: {
    viewsLabel: '项目访问量',
    liveTracking: '实时仓库访问统计',
    starsLabel: '获赞数:',
    forksLabel: '复刻数:'
  }
};

function truncateText(text: string, maxChars: number = 42): string {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars - 1).trimEnd() + '…';
}

export function renderRepoViewsCard(
  repo: RepoStats,
  viewsCount: number,
  themeName?: string,
  overrides?: Record<string, string>,
  locale: string = 'es',
  customLabel?: string
): string {
  const theme = getTheme(themeName, overrides);
  const cardWidth = 495;
  const cardHeight = 155;
  const widthAttr = escapeXml(overrides?.cardWidth || `${cardWidth}`);

  const langKey = locale.toLowerCase() in REPO_VIEWS_I18N ? locale.toLowerCase() : 'es';
  const i18nText = REPO_VIEWS_I18N[langKey];

  const safeName = escapeXml(repo.name);
  const safeOwner = escapeXml(repo.owner);
  const safeLanguage = escapeXml(repo.language || '');
  const safeLanguageColor = escapeXml(repo.languageColor || '#858585');
  const safeStars = escapeXml(String(Number(repo.stars) || 0));
  const safeForks = escapeXml(String(Number(repo.forks) || 0));
  const safeDescription = escapeXml(truncateText(repo.description || i18nText.liveTracking, 42));
  const safeViews = escapeXml(Number(viewsCount || 0).toLocaleString());
  const safeViewsLabel = escapeXml(
    customLabel && customLabel.trim() !== '' ? customLabel.trim() : i18nText.viewsLabel
  );
  const safeLiveText = escapeXml(i18nText.liveTracking);
  const safeStarsLabel = escapeXml(i18nText.starsLabel);
  const safeForksLabel = escapeXml(i18nText.forksLabel);
  const safeTitleColor = escapeXml(theme.title);
  const safeSecondaryColor = escapeXml(theme.secondary);
  const safeTextColor = escapeXml(theme.text);
  const safeAccentColor = escapeXml(theme.accent);
  const safeBorderColor = escapeXml(theme.border);

  const backgroundDef = getBackgroundDef(theme, 'bg');

  return minifySvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" role="img" aria-label="${safeOwner}/${safeName}: ${safeViews} ${safeViewsLabel}">
      <title>${safeOwner}/${safeName} - ${safeViewsLabel}: ${safeViews}</title>
      <desc>Project views counter card for ${safeOwner}/${safeName}</desc>
      <defs>
        ${backgroundDef}
        <style>
          .title { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${safeTitleColor}; }
          .owner { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 500; font-size: 12px; fill: ${safeSecondaryColor}; }
          .desc { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 400; font-size: 12px; fill: ${safeTextColor}; }
          .sub { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 500; font-size: 11px; fill: ${safeSecondaryColor}; }
          .views-num { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 800; font-size: 24px; fill: ${safeAccentColor}; }
          .views-lbl { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 11px; fill: ${safeTextColor}; text-transform: uppercase; letter-spacing: 0.4px; }
          .label { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 12px; fill: ${safeTextColor}; }
          .value { font-family: 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 12px; fill: ${safeAccentColor}; }
          .icon { fill: ${safeAccentColor}; }
        </style>
      </defs>

      <!-- Card Background -->
      <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg)" stroke="${safeBorderColor}" stroke-width="1.5" />

      <!-- Repository Header -->
      <g transform="translate(25, 28)">
        <svg class="icon" viewBox="0 0 24 24" width="20" height="20" x="0" y="0">
          ${ICONS.repo}
        </svg>
        <text x="28" y="-2" class="owner">${safeOwner} /</text>
        <text x="28" y="15" class="title">${safeName}</text>
      </g>

      <!-- Left Info Section -->
      <g transform="translate(25, 76)">
        <text x="0" y="0" class="desc">${safeDescription}</text>
        <circle cx="5" cy="18" r="3.5" fill="${safeAccentColor}" />
        <text x="14" y="22" class="sub">${safeLiveText}</text>
      </g>

      <!-- Project Views Counter Highlight Box -->
      <g transform="translate(315, 48)">
        <rect width="155" height="54" rx="10" fill="${safeAccentColor}" fill-opacity="0.1" stroke="${safeBorderColor}" stroke-width="1" />
        <svg class="icon" viewBox="0 0 24 24" width="18" height="18" x="14" y="10">
          ${ICONS.eye}
        </svg>
        <text x="38" y="25" class="views-num">${safeViews}</text>
        <text x="14" y="44" class="views-lbl">${safeViewsLabel}</text>
      </g>

      <!-- Decorative Divider -->
      <line x1="25" y1="115" x2="470" y2="115" stroke="${safeBorderColor}" stroke-dasharray="2, 2" stroke-width="1" />

      <!-- Footer Metrics -->
      <g transform="translate(25, 128)">
        <g transform="translate(0, 0)">
          <circle cx="6" cy="6" r="5" fill="${safeLanguageColor}" />
          <text x="16" y="10" class="label">${safeLanguage}</text>
        </g>

        <g transform="translate(145, 0)">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" x="0" y="-2">
            ${ICONS.star}
          </svg>
          <text x="18" y="10" class="label">${safeStarsLabel}</text>
          <text x="80" y="10" class="value">${safeStars}</text>
        </g>

        <g transform="translate(270, 0)">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" x="0" y="-2">
            ${ICONS.fork}
          </svg>
          <text x="18" y="10" class="label">${safeForksLabel}</text>
          <text x="60" y="10" class="value">${safeForks}</text>
        </g>
      </g>

      <!-- Brand Logo / Subtitle -->
      ${renderBrandHeader(`${safeOwner}/${safeName}`, theme)}
    </svg>
  `);
}
