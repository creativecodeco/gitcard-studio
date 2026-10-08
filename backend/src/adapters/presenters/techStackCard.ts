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

// Predefined brand colors for popular tech stack items
const TECH_BRAND_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  node: '#5fa04e',
  'node.js': '#5fa04e',
  react: '#61dafb',
  astro: '#ff5d01',
  vue: '#4fc08d',
  'next.js': '#61dafb',
  nextjs: '#61dafb',
  python: '#3776ab',
  postgres: '#4169e1',
  postgresql: '#4169e1',
  docker: '#2496ed',
  kubernetes: '#326ce5',
  k8s: '#326ce5',
  aws: '#ff9900',
  rust: '#dea584',
  go: '#00add8',
  golang: '#00add8',
  tailwind: '#06b6d4',
  fastify: '#000000',
  nestjs: '#e0234e',
  redis: '#dc382d',
  mongodb: '#47a248',
  graphql: '#e10098',
  java: '#b07219',
  cpp: '#f34b7d',
  csharp: '#178600',
  git: '#f05032',
  linux: '#fcb813'
};

/**
 * Returns an inline SVG icon string scaled inside a 24x24 viewBox for popular tech items.
 */
export function getTechIconSvg(techName: string, color: string): string {
  const key = techName
    .toLowerCase()
    .trim()
    .replace(/[\s._-]+/g, '');

  switch (key) {
    case 'react':
    case 'reactjs':
    case 'reactnative':
      return `<ellipse cx="12" cy="12" rx="7" ry="2.5" fill="none" stroke="${color}" stroke-width="1.4"/><ellipse cx="12" cy="12" rx="7" ry="2.5" fill="none" stroke="${color}" stroke-width="1.4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="7" ry="2.5" fill="none" stroke="${color}" stroke-width="1.4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.8" fill="${color}"/>`;

    case 'typescript':
    case 'ts':
      return `<rect x="4" y="4" width="16" height="16" rx="3" fill="${color}"/><path d="M7 9h4.5m-2.25 0v7M13.5 16c.5.4 1.1.6 1.8.6 1 0 1.5-.4 1.5-1 0-.7-.6-.9-1.5-1.2l-.5-.2c-1.3-.4-2-1-2-2.1 0-1.4 1.2-2.3 3-2.3 1 0 1.8.3 2.4.7l-.6 1.2c-.5-.3-1.1-.5-1.7-.5-.8 0-1.2.4-1.2.9 0 .5.5.8 1.4 1.1l.5.2c1.5.4 2.2 1 2.2 2.2 0 1.5-1.2 2.4-3.2 2.4-1.1 0-2.1-.3-2.8-.9l.6-1.2z" fill="#fff"/>`;

    case 'javascript':
    case 'js':
      return `<rect x="4" y="4" width="16" height="16" rx="3" fill="${color}"/><path d="M10.5 16c-.8.5-1.8.6-2.5.3l.3-1.2c.5.2 1.1.3 1.6.1.5-.2.7-.6.7-1.4V9h1.5v5c0 1.3-.6 1.9-1.6 2zm4.5 0c-1.1 0-2.1-.3-2.8-.9l.6-1.2c.6.5 1.5.8 2.2.8.8 0 1.2-.4 1.2-.9 0-.5-.5-.8-1.4-1.1l-.5-.2c-1.5-.4-2.2-1-2.2-2.2 0-1.5 1.2-2.4 3.2-2.4 1 0 1.8.3 2.4.7l-.6 1.2c-.5-.3-1.1-.5-1.7-.5-.8 0-1.2.4-1.2.9 0 .5.5.8 1.4 1.1l.5.2c1.5.4 2.2 1 2.2 2.2 0 1.5-1.2 2.4-3.2 2.4z" fill="#000"/>`;

    case 'node':
    case 'nodejs':
      return `<path d="M12 3.5l7.5 4.3v8.7L12 20.8 4.5 16.5V7.8L12 3.5z" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M12 7l4.5 2.6v5.2L12 17.4 7.5 14.8V9.6L12 7z" fill="${color}"/>`;

    case 'python':
    case 'py':
      return `<path d="M11.8 3.5c-3.7 0-3.5 1.6-3.5 1.6v1.7h3.6v.5H6.8S4.5 7.1 4.5 10.8s2 3.5 2 3.5h1.2v-1.7c0-2.4 2.1-2.3 2.1-2.3h3.5s2 0 2-2V6.3s.2-2.8-3.5-2.8zm-1.8 1.1c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7z" fill="${color}"/><path d="M12.2 20.5c3.7 0 3.5-1.6 3.5-1.6v-1.7h-3.6v-.5h5.1s2.3.2 2.3-3.5-2-3.5-2-3.5h-1.2v1.7c0 2.4-2.1 2.3-2.1 2.3h-3.5s-2 0-2 2v2c0 2.8-.2 2.8 3.5 2.8zm1.8-1.1c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z" fill="${color}"/>`;

    case 'postgres':
    case 'postgresql':
    case 'sql':
    case 'database':
    case 'db':
      return `<path d="M12 4c-4.5 0-8 1.3-8 3v10c0 1.7 3.5 3 8 3s8-1.3 8-3V7c0-1.7-3.5-3-8-3z" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M4 12c0 1.7 3.5 3 8 3s8-1.3 8-3M4 8c0 1.7 3.5 3 8 3s8-1.3 8-3" fill="none" stroke="${color}" stroke-width="1.6"/>`;

    case 'docker':
      return `<path d="M3 13.5h18c0 3.5-2.8 6.5-6.5 6.5h-5C5.8 20 3 17 3 13.5z" fill="${color}"/><rect x="5.5" y="9.5" width="3" height="3" fill="${color}" rx="0.5"/><rect x="9.5" y="9.5" width="3" height="3" fill="${color}" rx="0.5"/><rect x="13.5" y="9.5" width="3" height="3" fill="${color}" rx="0.5"/><rect x="9.5" y="5.5" width="3" height="3" fill="${color}" rx="0.5"/>`;

    case 'aws':
    case 'amazon':
      return `<path d="M19.3 10a7.5 7.5 0 00-14.6-2A6 6 0 000 14c0 3.3 2.7 6 6 6h13c2.8 0 5-2.2 5-5 0-2.6-2-4.8-4.7-5z" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M6 16c2 1.5 6 2 10 0" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`;

    case 'git':
    case 'github':
      return `<path d="M18 13a3 3 0 100-6 3 3 0 000 6zM6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6z" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M6 9v6M18 10a6 6 0 01-6 6H6" fill="none" stroke="${color}" stroke-width="1.6"/>`;

    case 'vue':
    case 'vuejs':
      return `<path d="M2 4l10 17L22 4h-4.5L12 13.5 6.5 4H2z" fill="${color}"/><path d="M6.5 4l5.5 9.5L17.5 4h-3L12 8.5 9.5 4h-3z" fill="${color}" opacity="0.6"/>`;

    case 'tailwind':
    case 'tailwindcss':
      return `<path d="M12 6c-2.4 0-4 1.2-4.8 3.6 1.2-.6 2.4-.4 3 .2.8.8.8 2 1.8 3 1 1.2 2.2 1.8 4 1.8 2.4 0 4-1.2 4.8-3.6-1.2.6-2.4.4-3-.2-.8-.8-.8-2-1.8-3C15.2 6.6 14 6 12 6zm-4.8 6C4.8 12 3.2 13.2 2.4 15.6c1.2-.6 2.4-.4 3 .2.8.8.8 2 1.8 3 1 1.2 2.2 1.8 4 1.8 2.4 0 4-1.2 4.8-3.6-1.2.6-2.4.4-3-.2-.8-.8-.8-2-1.8-3-.8-1.2-2-1.8-4-1.8z" fill="${color}"/>`;

    case 'astro':
      return `<path d="M12 3L5 19h3.5l1.5-4h4l1.5 4H19L12 3zm-1 8.5l1-3 1 3h-2z" fill="${color}"/><path d="M16 15c1.5 1 2.5 2.5 2.5 2.5s-2-1-3.5-1-3.5 1-3.5 1 1-1.5 2.5-2.5z" fill="${color}"/>`;

    case 'rust':
      return `<circle cx="12" cy="12" r="7" fill="none" stroke="${color}" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>`;

    case 'go':
    case 'golang':
      return `<path d="M4 8h10M4 12h14M4 16h8" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`;

    case 'html':
    case 'html5':
    case 'css':
    case 'css3':
      return `<path d="M4 3l1.5 15L12 20.5 18.5 18 20 3H4zm11.5 5H9l.3 3h5.9l-.5 5.5-2.7.8-2.7-.8-.2-2H7.5l.3 3.5 4.2 1.2 4.2-1.2.6-7H8.7l-.3-3h7.4l-.3-1.5z" fill="${color}"/>`;

    case 'graphql':
      return `<polygon points="12 2 20.7 7 20.7 17 12 22 3.3 17 3.3 7" fill="none" stroke="${color}" stroke-width="1.6"/><circle cx="12" cy="2" r="2" fill="${color}"/><circle cx="20.7" cy="7" r="2" fill="${color}"/><circle cx="20.7" cy="17" r="2" fill="${color}"/><circle cx="12" cy="22" r="2" fill="${color}"/><circle cx="3.3" cy="7" r="2" fill="${color}"/><circle cx="3.3" cy="7" r="2" fill="${color}"/>`;

    case 'redis':
    case 'mongodb':
      return `<path d="M12 3L4 7v10l8 4 8-4V7l-8-4zm0 2.5l5.5 2.8L12 11 6.5 8.3 12 5.5z" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M4 12l8 4 8-4" fill="none" stroke="${color}" stroke-width="1.6"/>`;

    case 'nextjs':
    case 'next':
      return `<circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M9 8v8M15 8l-6 8h3l3-4V8" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;

    default:
      // Code brackets default icon `< />`
      return `<path d="M8 8L4 12l4 4M16 8l4 4-4 4M13 5l-2 14" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

export function renderTechStackCard(
  username: string,
  stackList: string[],
  themeName?: string,
  overrides?: Record<string, string>
): string {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const fontFamily = getFontFamily(overrides?.font);

  const isCompact = overrides?.layout === 'compact';
  const cardWidth = 495;
  const cardHeight = isCompact ? 130 : 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  const borderRadius = overrides?.borderRadius ? Number.parseInt(overrides.borderRadius, 10) : 12;
  const showBorder = overrides?.showBorder !== 'false';
  const enableGlow = overrides?.glow === 'true';

  const backgroundDef = getBackgroundDef(theme, 'bg');
  const glowDef = enableGlow ? renderGlowFilter('card-glow', theme.accent) : '';

  const cardTitle = escapeXml(
    overrides?.title || t.stats.techStackTitle || 'Tech Stack & Ecosystem'
  );

  // Fallback stack items if empty
  const rawItems =
    stackList.length > 0
      ? stackList
      : ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'AWS'];

  // Dynamic layout calculation for pills
  const maxPills = isCompact ? 8 : 12;
  const displayItems = rawItems.slice(0, maxPills);

  let currentX = 25;
  let currentY = isCompact ? 55 : 68;
  const rowMaxX = 465;
  const itemElements: string[] = [];

  displayItems.forEach((tech) => {
    const cleanTech = tech.trim();
    if (!cleanTech) return;

    const safeTech = escapeXml(cleanTech);
    const lowerKey = cleanTech.toLowerCase();
    const brandColor = TECH_BRAND_COLORS[lowerKey] || theme.accent;

    // Width calculation with icon offset: padding (32) + text width (~8.2px per char)
    const pillWidth = Math.max(78, Math.min(145, safeTech.length * 8.2 + 32));

    // Move to next line if row overflows
    if (currentX + pillWidth > rowMaxX) {
      currentX = 25;
      currentY += isCompact ? 28 : 34;
    }

    // Only render if within card bounds
    if (currentY + 24 <= cardHeight - 15) {
      const iconSvg = getTechIconSvg(cleanTech, brandColor);
      itemElements.push(`
        <g transform="translate(${currentX}, ${currentY})">
          <rect width="${pillWidth}" height="24" rx="12" fill="${theme.bg}" stroke="${brandColor}" stroke-width="1.2" opacity="0.9" />
          <g transform="translate(6, 4) scale(0.67)">
            ${iconSvg}
          </g>
          <text x="26" y="16" font-family="${fontFamily}" font-size="11.5px" font-weight="600" fill="${theme.text}">${safeTech}</text>
        </g>
      `);
      currentX += pillWidth + 8;
    }
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
      <title>${escapeXml(username)} - Tech Stack</title>
      <desc>Tech Stack &amp; Ecosystem card for ${escapeXml(username)}</desc>
      <defs>
        ${backgroundDef}
        ${glowDef}
        <style>
          .title { font-family: ${fontFamily}; font-weight: 700; font-size: ${isCompact ? '15px' : '17px'}; fill: ${theme.title}; }
          .glow { filter: url(#card-glow); }
        </style>
      </defs>

      <!-- Card Background Frame -->
      ${cardFrame}

      <!-- Title -->
      <text x="25" y="${isCompact ? '35' : '42'}" class="title">${cardTitle}</text>

      <!-- Tech Pills Grid -->
      <g>
        ${itemElements.join('\n')}
      </g>

      <!-- Brand Logo / Subtitle -->
      ${renderBrandHeader(username, theme, 470, isCompact ? 22 : 25)}
    </svg>
  `);
}
