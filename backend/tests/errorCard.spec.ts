import { describe, expect, it } from 'vitest';
import { renderErrorCard } from '../src/adapters/presenters/errorCard';

describe('renderErrorCard Presenter', () => {
  it('should render a clean localized 404 user not found error card', () => {
    const rawError = 'GitHub API error (404) for URL https://api.github.com/users/joaltoorc';
    const svg = renderErrorCard(rawError, 'dark', { username: 'joaltoorc' });

    expect(svg).toContain('<svg');
    expect(svg).toContain('<title>Usuario no encontrado</title>');
    expect(svg).toContain('No se encontró el usuario @joaltoorc en GitHub.');
    expect(svg).toContain('Verifica la ortografía del usuario e intenta de nuevo.');
    expect(svg).not.toContain('https://api.github.com/users/joaltoorc');
    expect(svg).toContain('github.com/joaltoorc');
  });

  it('should handle 403 rate limit errors gracefully', () => {
    const rawError = 'GitHub API error (403) Rate limit exceeded';
    const svg = renderErrorCard(rawError, 'dark');

    expect(svg).toContain('<title>Límite de API Alcanzado</title>');
    expect(svg).toContain('Se superó la cuota temporal de solicitudes a GitHub.');
    expect(svg).toContain('Configura un token personal de GitHub');
  });

  it('should wrap long custom error messages into tspans without overflowing', () => {
    const longMessage =
      'Un mensaje extremadamente largo que supera los cuarenta y seis caracteres permitidos en una sola línea del SVG';
    const svg = renderErrorCard(longMessage, 'dark');

    expect(svg).toContain('<tspan');
    expect(svg).toContain('Un mensaje extremadamente largo que supera');
  });

  it('should XML-escape special characters in error inputs', () => {
    const maliciousMsg = '<script>alert("xss")</script>';
    const svg = renderErrorCard(maliciousMsg, 'dark');

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('should apply custom theme backgrounds when requested', () => {
    const svg = renderErrorCard('Error de prueba', 'tokyonight');
    expect(svg).toContain('#1a1b26');
  });
});
