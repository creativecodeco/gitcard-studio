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
    bgGradient: ['bgGradient', 'bg_gradient']
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
    if (['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh'].includes(normalized)) {
      overrides.locale = normalized;
    }
  }

  // Border radius extraction (0 to 24px)
  const borderRadiusVal = query.border_radius ?? query.borderRadius;
  if (typeof borderRadiusVal === 'string' && /^\d+$/.test(borderRadiusVal.trim())) {
    const radiusNum = Number.parseInt(borderRadiusVal.trim(), 10);
    overrides.borderRadius = String(Math.min(24, Math.max(0, radiusNum)));
  }

  // Border visibility extraction
  if (query.hide_border === 'true' || query.show_border === 'false') {
    overrides.showBorder = 'false';
  } else if (query.show_border === 'true') {
    overrides.showBorder = 'true';
  }

  // Glow filter extraction
  if (query.glow === 'true' || query.glow === '1') {
    overrides.glow = 'true';
  }

  // Font family extraction
  if (typeof query.font === 'string' && query.font.trim() !== '') {
    overrides.font = query.font.trim();
  }

  // Hide parameters extraction
  if (typeof query.hide === 'string' && query.hide.trim() !== '') {
    overrides.hide = query.hide.trim();
  }
  const hideLangs = query.hide_languages ?? query.hide_langs;
  if (typeof hideLangs === 'string' && hideLangs.trim() !== '') {
    overrides.hide_languages = hideLangs.trim();
  }
  if (typeof query.hide_repos === 'string' && query.hide_repos.trim() !== '') {
    overrides.hide_repos = query.hide_repos.trim();
  }

  // Privacy parameters extraction
  if (query.hide_username === 'true' || query.hide_username === '1' || query.hide_name === 'true') {
    overrides.hide_username = 'true';
  }
  if (query.blur_avatar === 'true' || query.blur_avatar === '1') {
    overrides.blur_avatar = 'true';
  }

  // Layout mode extraction (compact, mini, detailed, default)
  if (typeof query.layout === 'string') {
    const layoutClean = query.layout.toLowerCase().trim();
    if (['compact', 'mini', 'detailed'].includes(layoutClean)) {
      overrides.layout = layoutClean;
    }
  }

  // Tech stack & custom title extraction
  const stackVal = query.stack ?? query.tech;
  if (typeof stackVal === 'string' && stackVal.trim() !== '') {
    overrides.stack = stackVal.trim();
  }
  if (typeof query.title === 'string' && query.title.trim() !== '') {
    overrides.title = query.title.trim();
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
