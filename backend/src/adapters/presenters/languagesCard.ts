import { LanguageStat } from '@/domain/entities/LanguageStat';
import {
  getTheme,
  getBackgroundDef,
  renderBrandHeader,
  getFontFamily,
  renderGlowFilter,
  renderCardFrame
} from './theme';
import { getTranslations } from './i18n';

export function renderLanguagesCard(
  languages: LanguageStat[],
  themeName?: string,
  overrides?: Record<string, string>,
  username?: string
): string {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);
  const fontFamily = getFontFamily(overrides?.font);

  const isCompact = overrides?.layout === 'compact';
  const cardWidth = 495;
  const cardHeight = isCompact ? 130 : 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  const borderRadius = overrides?.borderRadius ? parseInt(overrides.borderRadius, 10) : 12;
  const showBorder = overrides?.showBorder !== 'false';
  const enableGlow = overrides?.glow === 'true';

  const backgroundDef = getBackgroundDef(theme, 'bg');
  const glowDef = enableGlow ? renderGlowFilter('card-glow', theme.accent) : '';

  // Parse hidden languages
  const hiddenLangs = new Set(
    (overrides?.hide_languages || '')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  // Filter languages
  let filteredLanguages = languages.filter(
    (l) => l.percentage > 0 && !hiddenLangs.has(l.name.toLowerCase())
  );

  // Recalculate percentages relative to remaining languages
  const totalPercent = filteredLanguages.reduce((acc, l) => acc + l.percentage, 0);
  if (totalPercent > 0 && filteredLanguages.length > 0) {
    filteredLanguages = filteredLanguages.map((l) => ({
      ...l,
      percentage: Number(((l.percentage / totalPercent) * 100).toFixed(1))
    }));
  }

  // Generate stacked bar segments
  let currentX = 25;
  const barWidth = 445;
  const barSegments: string[] = [];

  filteredLanguages.forEach((lang) => {
    const segmentWidth = (lang.percentage / 100) * barWidth;
    barSegments.push(
      `<rect x="${currentX}" y="${isCompact ? '55' : '65'}" width="${segmentWidth}" height="${isCompact ? '10' : '12'}" fill="${lang.color}" />`
    );
    currentX += segmentWidth;
  });

  // Generate Legend
  const legendItems: string[] = [];
  filteredLanguages.forEach((lang, index) => {
    const isCol2 = index % 2 !== 0;
    const colX = isCol2 ? 260 : 25;
    const rowY = (isCompact ? 80 : 105) + Math.floor(index / 2) * (isCompact ? 18 : 23);

    legendItems.push(`
      <g transform="translate(${colX}, ${rowY})">
        <circle cx="6" cy="6" r="5" fill="${lang.color}" />
        <text x="18" y="9" class="legend-name">${lang.name}</text>
        <text x="140" y="9" class="legend-percent">${lang.percentage}%</text>
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

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
      <title>${t.languages.title}</title>
      <desc>Top programming languages stats card</desc>
      <defs>
        ${backgroundDef}
        ${glowDef}
        <clipPath id="bar-clip">
          <rect x="25" y="${isCompact ? '55' : '65'}" width="${barWidth}" height="${isCompact ? '10' : '12'}" rx="6" />
        </clipPath>
        <style>
          .title { font-family: ${fontFamily}; font-weight: 700; font-size: ${isCompact ? '15px' : '16px'}; fill: ${theme.title}; }
          .legend-name { font-family: ${fontFamily}; font-weight: 600; font-size: ${isCompact ? '11.5px' : '12.5px'}; fill: ${theme.text}; }
          .legend-percent { font-family: ${fontFamily}; font-weight: 500; font-size: ${isCompact ? '11.5px' : '12.5px'}; fill: ${theme.secondary}; }
        </style>
      </defs>

      <!-- Card Background -->
      ${cardFrame}

      <!-- Title -->
      <text x="25" y="${isCompact ? '35' : '42'}" class="title">${t.languages.title}</text>

      <!-- Stacked Progress Bar -->
      <g clip-path="url(#bar-clip)">
        ${barSegments.join('\n')}
      </g>

      <!-- Legend Grid -->
      <g>
        ${legendItems.join('\n')}
      </g>

      <!-- Brand Logo / Subtitle -->
      ${renderBrandHeader(username || '', theme, 470, isCompact ? 22 : 25)}
    </svg>
  `.trim();
}
