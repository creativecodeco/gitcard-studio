import { StreakStats } from '@/domain/entities/StreakStats';
import { getTheme, getBackgroundDef, renderBrandHeader } from './theme';
import { getTranslations } from './i18n';

// Friendly month abbreviations
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  const month = MONTHS[Number.parseInt(m, 10) - 1];
  return `${month} ${Number.parseInt(d, 10)}`;
}

function formatDateFull(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  const month = MONTHS[Number.parseInt(m, 10) - 1];
  const [y] = iso.split('-');
  return `${month} ${Number.parseInt(d, 10)}, ${y}`;
}

export function renderStreakCard(
  stats: StreakStats,
  themeName?: string,
  overrides?: Record<string, string>
): string {
  const theme = getTheme(themeName, overrides);
  const t = getTranslations(overrides?.locale);

  const cardWidth = 495;
  const cardHeight = 195;
  const widthAttr = overrides?.cardWidth || `${cardWidth}`;

  // Background gradient definition
  const backgroundDef = getBackgroundDef(theme, 'bg-streak');

  // Date range labels
  const totalRange = stats.firstContributionDate
    ? `${formatDateFull(stats.firstContributionDate)} - ${t.streak.present}`
    : 'N/A';

  let currentStreakRange = t.streak.noStreak;
  if (stats.currentStreak > 0) {
    if (stats.currentStreakStart === stats.currentStreakEnd) {
      currentStreakRange = formatDate(stats.currentStreakEnd);
    } else {
      currentStreakRange = `${formatDate(stats.currentStreakStart)} - ${formatDate(stats.currentStreakEnd)}`;
    }
  }

  let longestStreakRange = 'N/A';
  if (stats.longestStreak > 0) {
    if (stats.longestStreakStart === stats.longestStreakEnd) {
      longestStreakRange = formatDateFull(stats.longestStreakStart);
    } else {
      longestStreakRange = `${formatDateFull(stats.longestStreakStart)} - ${formatDateFull(stats.longestStreakEnd)}`;
    }
  }

  // Column x centers
  const col1 = 82;
  const col2 = 247;
  const col3 = 413;

  // Accent color for current streak ring (use title color which is typically vibrant)
  const ringColor = theme.title;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
  <defs>
    ${backgroundDef}
    <style>
      .streak-big   { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 700; font-size: 28px; }
      .streak-label { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 600; font-size: 13px; }
      .streak-sub   { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 400; font-size: 11px; }
      .streak-brand { font-family: 'Segoe UI', Ubuntu, Sans-Serif; font-weight: 600; font-size: 9px; }
    </style>
  </defs>

  <!-- Card Background -->
  <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="url(#bg-streak)" stroke="${theme.border}" stroke-width="1.5"/>

  <!-- Header Title -->
  <text x="20" y="26" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="700" font-size="14px" fill="${theme.title}">${t.streak.title}</text>

  <!-- Brand Logo / Subtitle -->
  ${renderBrandHeader(stats.username, theme)}

  <!-- Divider 1 -->
  <line x1="164" y1="42" x2="164" y2="175" stroke="${theme.border}" stroke-width="1.5" opacity="0.8"/>
  <!-- Divider 2 -->
  <line x1="330" y1="42" x2="330" y2="175" stroke="${theme.border}" stroke-width="1.5" opacity="0.8"/>

   <!-- ── Column 1: Total Contributions ── -->
  <!-- Big number -->
  <text x="${col1}" y="105" text-anchor="middle" class="streak-big" fill="${theme.accent}">${stats.totalContributions}</text>
  <!-- Label -->
  <text x="${col1}" y="129" text-anchor="middle" class="streak-label" fill="${theme.text}">${t.streak.total}</text>
  <!-- Date sub-label -->
  <text x="${col1}" y="148" text-anchor="middle" class="streak-sub" fill="${theme.secondary}">${totalRange}</text>

  <!-- ── Column 2: Current Streak ── -->
  <!-- Ring (circle outline) -->
  <circle cx="${col2}" cy="88" r="38" fill="none" stroke="${ringColor}" stroke-width="4" opacity="0.25"/>
  <circle cx="${col2}" cy="88" r="38" fill="none" stroke="${ringColor}" stroke-width="4"
    stroke-dasharray="188" stroke-dashoffset="${stats.currentStreak > 0 ? 0 : 188}"
    stroke-linecap="round" transform="rotate(-90 ${col2} 88)"/>

  <!-- Fire emoji / icon inside ring -->
  <text x="${col2}" y="82" text-anchor="middle" font-size="20">${stats.currentStreak > 0 ? '🔥' : '💤'}</text>
  <!-- Streak number -->
  <text x="${col2}" y="102" text-anchor="middle" class="streak-big" fill="${ringColor}">${stats.currentStreak}</text>

  <!-- Label below ring -->
  <text x="${col2}" y="144" text-anchor="middle" class="streak-label" fill="${theme.title}">${t.streak.current}</text>
  <!-- Date sub-label -->
  <text x="${col2}" y="160" text-anchor="middle" class="streak-sub" fill="${theme.secondary}">${currentStreakRange}</text>

  <!-- ── Column 3: Longest Streak ── -->
  <!-- Big number -->
  <text x="${col3}" y="105" text-anchor="middle" class="streak-big" fill="${theme.accent}">${stats.longestStreak}</text>
  <!-- Label -->
  <text x="${col3}" y="129" text-anchor="middle" class="streak-label" fill="${theme.text}">${t.streak.max}</text>
  <!-- Date sub-label -->
  <text x="${col3}" y="148" text-anchor="middle" class="streak-sub" fill="${theme.secondary}">${longestStreakRange}</text>
</svg>`.trim();
}
