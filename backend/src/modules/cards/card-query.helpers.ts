import { sanitizeColor, sanitizeGradient } from '@/adapters/presenters/theme';

/**
 * Parses theme color overrides and locale from a card query string map.
 * Supports both canonical keys and GitHub-style aliases (e.g. bg_color, icon_color).
 */
export function extractThemeOverrides(query: Record<string, unknown>): Record<string, string> {
  const overrides: Record<string, string> = {};

  const mappings: Record<string, string[]> = {
    bg: ['bg', 'bg_color'],
    text: ['text', 'text_color'],
    title: ['title', 'title_color'],
    accent: ['accent', 'icon_color', 'accent_color'],
    secondary: ['secondary', 'secondary_color'],
    border: ['border', 'border_color'],
    bgGradient: ['bgGradient', 'bg_gradient'],
  };

  for (const [targetKey, paramKeys] of Object.entries(mappings)) {
    for (const key of paramKeys) {
      const val = query[key];
      if (typeof val === 'string' && val.trim() !== '') {
        const trimmed = val.trim();
        if (targetKey === 'bgGradient') {
          const cleanGradient = sanitizeGradient(trimmed);
          if (cleanGradient) overrides[targetKey] = cleanGradient;
        } else {
          const cleanColor = sanitizeColor(trimmed);
          if (cleanColor) overrides[targetKey] = cleanColor;
        }
        break;
      }
    }
  }

  const loc = query.locale ?? query.lang;
  if (typeof loc === 'string') {
    const normalized = loc.toLowerCase().trim();
    if (normalized === 'en' || normalized === 'es') {
      overrides.locale = normalized;
    }
  }

  return overrides;
}

/**
 * Resolves the card width from query parameters.
 * Supports `full_width=true` (returns '100%') and explicit `card_width` / `width` values.
 */
export function extractCardWidth(query: Record<string, unknown>): string | undefined {
  const fullWidth = query.full_width === 'true' || query.full_width === '1';
  if (fullWidth) return '100%';

  const widthVal = query.card_width ?? query.width;
  if (typeof widthVal === 'string' && widthVal.trim() !== '') {
    const trimmed = widthVal.trim();
    if (/^\d+(?:px|%)?$/i.test(trimmed)) {
      return trimmed;
    }
  }

  return undefined;
}
