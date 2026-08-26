import { escapeXml } from '@/utils/escape';
import { getTheme, renderBrandHeader } from './theme';

export interface ErrorCardOptions {
  theme?: string;
  username?: string;
  locale?: string;
}

/**
 * Parses raw error messages (such as GitHub API 404/403 strings) into clean,
 * user-friendly localized messages without exposing internal API URLs.
 */
function parseErrorMessage(
  rawMessage: string,
  options?: ErrorCardOptions
): { title: string; body: string; hint: string } {
  const msg = rawMessage.trim();
  const targetUser = options?.username ? `@${options.username}` : '';

  // Case 1: GitHub API 404 (User or Repository Not Found)
  if (
    msg.includes('404') ||
    /users\/[a-z\d-_]+/i.test(msg) ||
    msg.toLowerCase().includes('not found')
  ) {
    return {
      title: 'Usuario no encontrado',
      body: targetUser
        ? `No se encontró el usuario ${targetUser} en GitHub.`
        : 'El usuario de GitHub especificado no existe.',
      hint: 'Verifica la ortografía del usuario e intenta de nuevo.'
    };
  }

  // Case 2: GitHub API 403 / Rate Limit Exceeded
  if (msg.includes('403') || msg.toLowerCase().includes('rate limit')) {
    return {
      title: 'Límite de API Alcanzado',
      body: 'Se superó la cuota temporal de solicitudes a GitHub.',
      hint: 'Configura un token personal de GitHub o reintenta en unos minutos.'
    };
  }

  // Case 3: Invalid Username or Repository Parameter
  if (msg.toLowerCase().includes('inválido') || msg.toLowerCase().includes('invalid')) {
    return {
      title: 'Parámetro Inválido',
      body: msg,
      hint: 'Verifica que el nombre de usuario o repositorio cumpla el formato de GitHub.'
    };
  }

  // Case 4: General fallback - clean raw internal URLs from error string
  const cleanBody = msg.replace(/\s*for URL https?:\/\/[^\s]+/gi, '').trim();

  return {
    title: 'Error en GitCard Studio',
    body: cleanBody || 'Ocurrió un inconveniente al generar la tarjeta.',
    hint: 'Verifica los datos ingresados o intenta más tarde.'
  };
}

/**
 * Wraps text into SVG <tspan> lines to ensure long messages do not overflow the card boundary.
 */
function formatSvgTextLines(text: string, maxLineLen: number = 46, maxLines: number = 2): string[] {
  if (text.length <= maxLineLen) {
    return [text];
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxLineLen) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Append ellipsis if remaining text exists
  const remainingWords = words.slice(lines.join(' ').split(' ').length).join(' ');
  if (remainingWords && lines.length > 0) {
    const lastIdx = lines.length - 1;
    if (lines[lastIdx].length + 3 <= maxLineLen) {
      lines[lastIdx] += '...';
    } else {
      lines[lastIdx] = lines[lastIdx].substring(0, maxLineLen - 3) + '...';
    }
  }

  return lines;
}

/**
 * Renders a standardized SVG error card to display inside GitHub README <img> tags.
 * All user-provided messages are XML-escaped and text-wrapped to prevent visual overflow.
 */
export function renderErrorCard(
  message: string,
  themeName?: string,
  options?: ErrorCardOptions
): string {
  const theme = getTheme(themeName);
  const parsed = parseErrorMessage(message, options);

  const titleText = escapeXml(parsed.title);
  const bodyText = parsed.body;
  const hintText = escapeXml(parsed.hint);

  const bodyLines = formatSvgTextLines(bodyText, 46, 2).map((l) => escapeXml(l));

  const errorColor = '#f85149';
  const cardBg = theme.bg || '#0d1117';
  const textColor = theme.text || '#c9d1d9';
  const subtextColor = theme.secondary || '#8b949e';

  const brandHeader = renderBrandHeader(options?.username, theme);

  const bodyTspans = bodyLines
    .map((line, i) => `<tspan x="68" dy="${i === 0 ? 0 : 20}">${line}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <title>${titleText}</title>
  <desc>${escapeXml(bodyText)}</desc>
  <rect width="495" height="195" rx="12" fill="${cardBg}" stroke="${errorColor}" stroke-width="1.5" />
  <g transform="translate(25, 40)">
    <!-- Error Icon -->
    <g transform="translate(0, 4)">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="${errorColor}" transform="scale(1.4)"/>
    </g>
    <!-- Title -->
    <text x="42" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="16px" fill="${errorColor}">${titleText}</text>
    <!-- Body Message (Wrapped) -->
    <text x="68" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13px" fill="${textColor}">${bodyTspans}</text>
    <!-- Hint / Subtext -->
    <text x="0" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11px" fill="${subtextColor}">${hintText}</text>
  </g>
  ${brandHeader}
</svg>`.trim();
}
