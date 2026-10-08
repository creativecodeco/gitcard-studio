import { escapeXml } from '../../utils/escape';

export interface Theme {
  bg: string;
  text: string;
  title: string;
  accent: string;
  secondary: string;
  border: string;
  bgGradient?: string; // CSS background linear-gradient if desired
}

const ALLOWED_FONTS: Record<string, string> = {
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  'fira code': "'Fira Code', monospace",
  'jetbrains mono': "'JetBrains Mono', monospace",
  outfit: "'Outfit', sans-serif",
  roboto: "'Roboto', sans-serif",
  ubuntu: "'Ubuntu', sans-serif",
  segoe: "'Segoe UI', Ubuntu, sans-serif"
};

export function getFontFamily(fontName?: string): string {
  if (!fontName || typeof fontName !== 'string') {
    return "'Segoe UI', Ubuntu, sans-serif";
  }
  const clean = fontName.toLowerCase().trim();
  return ALLOWED_FONTS[clean] || "'Segoe UI', Ubuntu, sans-serif";
}

export const THEMES: Record<string, Theme> = {
  dark: {
    bg: '#0d1117',
    text: '#c9d1d9',
    title: '#58a6ff',
    accent: '#58a6ff',
    secondary: '#8b949e',
    border: '#30363d'
  },
  light: {
    bg: '#ffffff',
    text: '#24292f',
    title: '#0969da',
    accent: '#0969da',
    secondary: '#57606a',
    border: '#d0d7de'
  },
  neon: {
    bg: '#050505',
    text: '#ffffff',
    title: '#00ff66',
    accent: '#00ff66',
    secondary: '#b3b3b3',
    border: '#00ff66',
    bgGradient: 'linear-gradient(135deg, #050505 0%, #12011a 100%)'
  },
  glassmorphism: {
    bg: 'rgba(15, 23, 42, 0.65)',
    text: '#e2e8f0',
    title: '#38bdf8',
    accent: '#38bdf8',
    secondary: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.15)',
    bgGradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)'
  },
  solarized: {
    bg: '#002b36',
    text: '#839496',
    title: '#268bd2',
    accent: '#2aa198',
    secondary: '#586e75',
    border: '#073642'
  },
  radical: {
    bg: '#141321',
    text: '#a9fef7',
    title: '#fe428e',
    accent: '#fe428e',
    secondary: '#9e9e9e',
    border: '#1a1830',
    bgGradient: 'linear-gradient(135deg, #141321 0%, #200b2e 100%)'
  },
  tokyonight: {
    bg: '#1a1b26',
    text: '#a9b1d6',
    title: '#7aa2f7',
    accent: '#79dac8',
    secondary: '#565f89',
    border: '#383e5a',
    bgGradient: 'linear-gradient(135deg, #1a1b26 0%, #16161e 100%)'
  },
  catppuccin_latte: {
    bg: '#eff1f5',
    text: '#4c4f69',
    title: '#8839ef',
    accent: '#1e66f5',
    secondary: '#6c6f85',
    border: '#bcc0cc',
    bgGradient: 'linear-gradient(135deg, #eff1f5 0%, #e6e9ef 100%)'
  },
  catppuccin_frappe: {
    bg: '#303446',
    text: '#c6d0f5',
    title: '#ca9ee6',
    accent: '#8caaee',
    secondary: '#838ba7',
    border: '#51576d',
    bgGradient: 'linear-gradient(135deg, #303446 0%, #232634 100%)'
  },
  catppuccin_macchiato: {
    bg: '#24273a',
    text: '#cad3f5',
    title: '#c6a0f6',
    accent: '#8aadf4',
    secondary: '#8087a2',
    border: '#494d64',
    bgGradient: 'linear-gradient(135deg, #24273a 0%, #181926 100%)'
  },
  catppuccin_mocha: {
    bg: '#1e1e2e',
    text: '#cdd6f4',
    title: '#cba6f7',
    accent: '#89b4fa',
    secondary: '#a6adc8',
    border: '#45475a',
    bgGradient: 'linear-gradient(135deg, #1e1e2e 0%, #11111b 100%)'
  },
  dracula: {
    bg: '#282a36',
    text: '#f8f8f2',
    title: '#bd93f9',
    accent: '#ff79c6',
    secondary: '#6272a4',
    border: '#44475a',
    bgGradient: 'linear-gradient(135deg, #282a36 0%, #191a21 100%)'
  },
  nord: {
    bg: '#2e3440',
    text: '#d8dee9',
    title: '#88c0d0',
    accent: '#81a1c1',
    secondary: '#e5e9f0',
    border: '#4c566a',
    bgGradient: 'linear-gradient(135deg, #2e3440 0%, #242933 100%)'
  },
  cyberpunk: {
    bg: '#090d16',
    text: '#00f0ff',
    title: '#ff0055',
    accent: '#ffe600',
    secondary: '#7685a0',
    border: '#ff0055',
    bgGradient: 'linear-gradient(135deg, #090d16 0%, #1a0022 100%)'
  },
  gruvbox: {
    bg: '#282828',
    text: '#ebdbb2',
    title: '#fabd2f',
    accent: '#fe8019',
    secondary: '#a89984',
    border: '#504945'
  },
  synthwave: {
    bg: '#1a102f',
    text: '#f0e6f6',
    title: '#ff7edb',
    accent: '#36f9f6',
    secondary: '#b39ddb',
    border: '#ff7edb',
    bgGradient: 'linear-gradient(135deg, #1a102f 0%, #2d124d 100%)'
  },
  midnight: {
    bg: '#000000',
    text: '#f1f5f9',
    title: '#38bdf8',
    accent: '#38bdf8',
    secondary: '#64748b',
    border: '#1e293b',
    bgGradient: 'linear-gradient(135deg, #000000 0%, #0f172a 100%)'
  },
  retrowave: {
    bg: '#18002e',
    text: '#ffe6f9',
    title: '#ff007f',
    accent: '#00f0ff',
    secondary: '#9e00ff',
    border: '#ff007f',
    bgGradient: 'linear-gradient(135deg, #18002e 0%, #30005c 100%)'
  }
};

const HEX_REGEX = /^#?([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_REGEX = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/i;
const HSL_REGEX =
  /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+))?\s*\)$/i;

const GRADIENT_REGEX = /^(?:linear|radial)-gradient\([^<>"'\r\n;]+\)$/i;

export function sanitizeColor(val?: string): string | undefined {
  if (!val || typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  const hexMatch = trimmed.match(HEX_REGEX);
  if (hexMatch) {
    const raw = hexMatch[1].replace(/[^0-9a-fA-F]/g, '');
    return `#${raw}`;
  }
  const rgbMatch = trimmed.match(RGB_REGEX);
  if (rgbMatch) {
    const r = Math.min(255, Number.parseInt(rgbMatch[1], 10));
    const g = Math.min(255, Number.parseInt(rgbMatch[2], 10));
    const b = Math.min(255, Number.parseInt(rgbMatch[3], 10));
    if (rgbMatch[4] !== undefined) {
      const a = Math.min(1, Math.max(0, Number.parseFloat(rgbMatch[4])));
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }
  const hslMatch = trimmed.match(HSL_REGEX);
  if (hslMatch) {
    const h = Math.min(360, Number.parseInt(hslMatch[1], 10));
    const s = Math.min(100, Number.parseInt(hslMatch[2], 10));
    const l = Math.min(100, Number.parseInt(hslMatch[3], 10));
    if (hslMatch[4] !== undefined) {
      const a = Math.min(1, Math.max(0, Number.parseFloat(hslMatch[4])));
      return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return undefined;
}

export function sanitizeGradient(val?: string): string | undefined {
  if (!val || typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (GRADIENT_REGEX.test(trimmed)) {
    return trimmed;
  }
  // Support comma-separated hex list (e.g., "ff007f,7928ca" or "#ff007f,#7928ca,#00f0ff")
  if (/^[0-9a-fA-F,#\s]+$/.test(trimmed)) {
    const rawParts = trimmed.split(',').map((p) => p.trim().replace(/^#/, ''));
    const validHexes = rawParts.filter((p) => HEX_REGEX.test(`#${p}`));
    if (validHexes.length >= 2) {
      const stops = validHexes.map((hex, idx) => {
        const percent = Math.round((idx / (validHexes.length - 1)) * 100);
        return `#${hex} ${percent}%`;
      });
      return `linear-gradient(135deg, ${stops.join(', ')})`;
    }
  }
  return undefined;
}

export function getTheme(themeName?: string, overrides?: Record<string, string>): Theme {
  let baseTheme = THEMES.dark;
  if (themeName) {
    const name = themeName.toLowerCase();
    baseTheme = THEMES[name] || THEMES.dark;
  }

  if (!overrides) return baseTheme;

  return {
    bg: sanitizeColor(overrides.bg) || baseTheme.bg,
    text: sanitizeColor(overrides.text) || baseTheme.text,
    title: sanitizeColor(overrides.title) || baseTheme.title,
    accent: sanitizeColor(overrides.accent) || baseTheme.accent,
    secondary: sanitizeColor(overrides.secondary) || baseTheme.secondary,
    border: sanitizeColor(overrides.border) || baseTheme.border,
    bgGradient: sanitizeGradient(overrides.bgGradient) || baseTheme.bgGradient
  };
}

const COLOR_MATCH_REGEX =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)|hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*[\d.]+)?\s*\)/gi;

export function getBackgroundDef(theme: Theme, gradientId: string = 'bg'): string {
  if (theme.bgGradient) {
    const colorMatches = theme.bgGradient.match(COLOR_MATCH_REGEX);
    if (colorMatches && colorMatches.length >= 2) {
      const stops = colorMatches.map((color, idx) => {
        const offset = Math.round((idx / (colorMatches.length - 1)) * 100);
        return `<stop offset="${offset}%" stop-color="${color}" />`;
      });
      return `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        ${stops.join('\n        ')}
      </linearGradient>`;
    }
  }
  return `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
       <stop offset="0%" stop-color="${theme.bg}" />
       <stop offset="100%" stop-color="${theme.bg}" />
     </linearGradient>`;
}

/**
 * Renders an SVG glow filter element.
 */
export function renderGlowFilter(id: string = 'glow', color?: string): string {
  const filterColor = color || '#38bdf8';
  return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="2.5" result="blur" />
    <feFlood flood-color="${filterColor}" flood-opacity="0.5" result="color" />
    <feComposite in="color" in2="blur" operator="in" result="glow" />
    <feMerge>
      <feMergeNode in="glow" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>`;
}

export interface CardFrameOptions {
  width: number;
  height: number;
  theme: Theme;
  gradientId?: string;
  borderRadius?: number;
  showBorder?: boolean;
  borderColor?: string;
}

/**
 * Renders the main outer card background rectangle with border radius & styling.
 */
export function renderCardFrame(options: CardFrameOptions): string {
  const {
    width,
    height,
    theme,
    gradientId = 'bg',
    borderRadius = 12,
    showBorder = true,
    borderColor
  } = options;
  const rx = Math.min(24, Math.max(0, borderRadius));
  const border = borderColor || theme.border;
  const strokeAttr = showBorder ? `stroke="${border}" stroke-width="1.5"` : '';
  return `<rect width="${width}" height="${height}" rx="${rx}" fill="url(#${gradientId})" ${strokeAttr} />`;
}

/**
 * Renders the standardized top-right brand header subtitle for SVG cards.
 */
export function renderBrandHeader(
  target?: string,
  theme?: Theme,
  x: number = 470,
  y: number = 25
): string {
  const currentTheme = theme || THEMES.dark;
  const cleanTarget = (target || '')
    .trim()
    .replace(/^(?:https?:\/\/)?(?:github\.com\/?)?/i, '')
    .replace(/^\/+/, '');

  const displayPath = cleanTarget ? `github.com/${cleanTarget}` : 'github.com';
  const safeDisplayUrl = escapeXml(displayPath);
  return `<text x="${x}" y="${y}" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif" font-weight="600" font-size="9px" fill="${currentTheme.secondary}" opacity="0.6">${safeDisplayUrl}</text>`;
}

/**
 * Renders SVG keyframe animation CSS rules.
 */
export function renderAnimationStyles(animationType?: string): string {
  if (!animationType || typeof animationType !== 'string') return '';

  const clean = animationType.toLowerCase().trim();

  if (clean === 'pulse') {
    return `
      @keyframes pulseAnim {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .pulse-anim { animation: pulseAnim 2s ease-in-out infinite; }
    `;
  }

  if (clean === 'fade-in' || clean === 'fade') {
    return `
      @keyframes fadeInAnim {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      svg { animation: fadeInAnim 0.6s ease-out forwards; }
    `;
  }

  if (clean === 'shimmer') {
    return `
      @keyframes shimmerAnim {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
      .shimmer-anim { animation: shimmerAnim 2.5s ease-in-out infinite; }
    `;
  }

  return '';
}
