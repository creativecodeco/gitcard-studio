import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildClearSessionCookieHeader,
  buildSessionCookieHeader,
  decryptOAuthSessionToken,
  encryptToken,
  decryptToken,
  extractSessionTokenFromCookie,
  generateConsentFingerprint,
  generateOAuthSessionToken,
  verifyOAuthSessionToken,
  validateTokenScopes
} from '@/infrastructure/security/security';
import { sanitizeColor } from '@/adapters/presenters/theme';
import { extractCardWidth } from '@/modules/cards/card-query.helpers';
import { GITHUB_REPO_REGEX, sanitizeBadgeLabel } from '@/domain/entities/Validation';
import { validateAvatarUrl } from '@/adapters/presenters/avatar';
import { renderRankCard } from '@/adapters/presenters/rankCard';
import { renderTrophiesCard } from '@/adapters/presenters/trophiesCard';
import { renderRepoCard } from '@/adapters/presenters/repoCard';
import { renderLanguagesCard } from '@/adapters/presenters/languagesCard';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('security.ts tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex characters (32 bytes)
  });

  it('should encrypt and decrypt a token correctly', () => {
    const originalToken = 'ghp_testToken12345';
    const { encryptedToken, iv } = encryptToken(originalToken);

    expect(encryptedToken).toBeDefined();
    expect(iv).toBeDefined();
    expect(encryptedToken).toContain(':');

    const decrypted = decryptToken(encryptedToken, iv);
    expect(decrypted).toBe(originalToken);
  });

  it('should generate and verify AES-256-GCM encrypted session tokens and reject tampered/wrong user tokens', () => {
    const token = generateOAuthSessionToken('OctoCat');
    expect(token.startsWith('gcss_v2.')).toBe(true);
    expect(token).not.toContain('octocat');
    expect(verifyOAuthSessionToken(token, 'octocat')).toBe(true);
    expect(verifyOAuthSessionToken(token, 'otheruser')).toBe(false);
    expect(verifyOAuthSessionToken(`${token}tampered`, 'octocat')).toBe(false);

    const decrypted = decryptOAuthSessionToken(token);
    expect(decrypted?.username).toBe('octocat');

    // Cookie helpers
    const cookieSet = buildSessionCookieHeader(token);
    expect(cookieSet).toContain('HttpOnly');
    expect(cookieSet).toContain('SameSite=Lax');
    const extracted = extractSessionTokenFromCookie(`other=1; ${cookieSet.split(';')[0]}`);
    expect(extracted).toBe(token);
    expect(buildClearSessionCookieHeader()).toContain('Max-Age=0');

    // Expired token should fail
    const expiredToken = generateOAuthSessionToken('octocat', -1000);
    expect(verifyOAuthSessionToken(expiredToken, 'octocat')).toBe(false);
  });

  it('should generate consent fingerprint consistently', () => {
    const ip = '127.0.0.1';
    const ua = 'Mozilla/5.0';
    const fingerprint1 = generateConsentFingerprint(ip, ua);
    const fingerprint2 = generateConsentFingerprint(ip, ua);

    expect(fingerprint1).toBe(fingerprint2);
    expect(fingerprint1).toHaveLength(64); // SHA-256 hex length
  });

  it('should reject token with dangerous scopes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'x-oauth-scopes') return 'repo, write:org';
          return null;
        }
      },
      json: async () => ({ login: 'testuser' })
    });

    const result = await validateTokenScopes('ghp_dangerous');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('permisos de escritura o administración');
  });

  it('should accept read-only metadata token', async () => {
    // 1. mock profile response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'x-oauth-scopes') return '';
          return null;
        }
      },
      json: async () => ({ login: 'testuser' })
    });

    // 2. mock probe repos POST request response (returns 403 Forbidden since it has no write scopes)
    mockFetch.mockResolvedValueOnce({
      status: 403,
      ok: false,
      json: async () => ({ message: 'Forbidden' })
    });

    const result = await validateTokenScopes('ghp_readonly');
    expect(result.valid).toBe(true);
  });

  it('should reject token that has repo creation permission (returns 422)', async () => {
    // 1. mock profile response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'x-oauth-scopes') return '';
          return null;
        }
      },
      json: async () => ({ login: 'testuser' })
    });

    // 2. mock probe repos POST request response (returns 422 Unprocessable Entity since it got past authorization and failed on body validation)
    mockFetch.mockResolvedValueOnce({
      status: 422,
      ok: false,
      json: async () => ({ message: 'Validation failed' })
    });

    const result = await validateTokenScopes('ghp_haswrite');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('permisos de creación/escritura');
  });

  it('should reject token when owner login does not match expectedUsername', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => ''
      },
      json: async () => ({ login: 'attackeruser' })
    });

    const result = await validateTokenScopes('ghp_readonly', 'victimuser');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('no coincide con el usuario');
  });

  describe('SSRF & Avatar URL validation', () => {
    it('should allow valid HTTPS external URLs and block SSRF private/loopback targets', () => {
      expect(validateAvatarUrl('https://avatars.githubusercontent.com/u/1?v=4')).toBe(true);
      expect(validateAvatarUrl('https://github.com/octocat.png')).toBe(true);

      // Block non-HTTPS and private/internal hosts
      expect(validateAvatarUrl('http://avatars.githubusercontent.com/u/1')).toBe(false);
      expect(validateAvatarUrl('https://localhost/admin')).toBe(false);
      expect(validateAvatarUrl('https://127.0.0.1:8080/secret')).toBe(false);
      expect(validateAvatarUrl('https://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(validateAvatarUrl('https://10.0.0.1/internal')).toBe(false);
      expect(validateAvatarUrl('https://172.16.0.5/internal')).toBe(false);
      expect(validateAvatarUrl('https://192.168.1.1/router')).toBe(false);
      expect(validateAvatarUrl('https://[::1]/loopback')).toBe(false);
      expect(validateAvatarUrl('https://metadata.google.internal/computeMetadata')).toBe(false);
    });
  });

  describe('SVG presenter XSS & CSS injection prevention', () => {
    it('should block CSS/SVG injection via font override in renderRankCard', () => {
      const svg = renderRankCard(
        {
          username: 'octocat',
          name: 'Octocat',
          avatarUrl: '',
          followers: 10,
          publicRepos: 5,
          totalStars: 20,
          totalCommits: 100,
          totalPRs: 5,
          totalIssues: 2,
          forksReceived: 1,
          rank: 'A',
          collaborationIndex: 50
        },
        'dark',
        { font: '}</style><script>alert(1)</script>' }
      );
      expect(svg).not.toContain('<script>');
      expect(svg).toContain("'Segoe UI', Ubuntu, sans-serif");
    });

    it('should escape XSS payloads in trophiesCard, repoCard, and languagesCard', () => {
      const xssStats = {
        username: 'octocat',
        name: '</title><script>alert(1)</script>',
        avatarUrl: '',
        followers: 1,
        publicRepos: 1,
        totalStars: 1,
        totalCommits: 1,
        totalPRs: 1,
        totalIssues: 1,
        forksReceived: 1,
        rank: 'B',
        collaborationIndex: 10
      };
      const trophiesSvg = renderTrophiesCard(xssStats, []);
      expect(trophiesSvg).not.toContain('<script>');
      expect(trophiesSvg).toContain('&lt;/title&gt;&lt;script&gt;');

      const repoSvg = renderRepoCard({
        name: '</title><script>alert(1)</script>',
        owner: 'octocat',
        description: 'test',
        stars: 1,
        forks: 1,
        language: 'TS',
        languageColor: '" onload="alert(1)',
        license: 'MIT'
      });
      expect(repoSvg).not.toContain('<script>');
      expect(repoSvg).not.toContain('onload="alert(1)');

      const langSvg = renderLanguagesCard([
        {
          name: '<script>alert(1)</script>',
          count: 1,
          size: 100,
          percentage: 100,
          color: '" onload="alert(1)'
        }
      ]);
      expect(langSvg).not.toContain('<script>');
      expect(langSvg).not.toContain('onload="alert(1)');
    });

    it('should reject dot and double-dot in GITHUB_REPO_REGEX', () => {
      expect(GITHUB_REPO_REGEX.test('.')).toBe(false);
      expect(GITHUB_REPO_REGEX.test('..')).toBe(false);
      expect(GITHUB_REPO_REGEX.test('octocat/..')).toBe(false);
      expect(GITHUB_REPO_REGEX.test('octocat/gitcard-studio')).toBe(true);
    });
  });

  describe('SVG attribute injection sanitization', () => {
    it('should sanitize valid hex, rgb, and hsl colors and reject XSS payload strings', () => {
      expect(sanitizeColor('#000000')).toBe('#000000');
      expect(sanitizeColor('38bdf8')).toBe('#38bdf8');
      expect(sanitizeColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
      expect(sanitizeColor('rgba(0, 0, 0, 0.5)')).toBe('rgba(0, 0, 0, 0.5)');

      // Malicious XSS attribute injection strings must return undefined
      expect(sanitizeColor('#000000" onload="alert(1)')).toBeUndefined();
      expect(sanitizeColor('red"><script>alert(1)</script>')).toBeUndefined();
      expect(sanitizeColor('url(http://malicious.com)')).toBeUndefined();
    });

    it('should validate card_width and reject attribute injection payloads', () => {
      expect(extractCardWidth({ width: '500px' })).toBe('500px');
      expect(extractCardWidth({ card_width: '100%' })).toBe('100%');
      expect(extractCardWidth({ full_width: 'true' })).toBe('100%');

      // Malicious payloads must return undefined
      expect(extractCardWidth({ width: '500px" onload="alert(1)' })).toBeUndefined();
      expect(extractCardWidth({ card_width: '100% font-size:100px' })).toBeUndefined();
    });

    it('should validate badge labels and reject XSS or invalid label payloads', () => {
      expect(sanitizeBadgeLabel('profile views', 'gitcard studio')).toBe('profile views');
      expect(sanitizeBadgeLabel('my-custom_badge.v1', 'default')).toBe('my-custom_badge.v1');

      // Invalid / XSS payloads fall back to default label
      expect(sanitizeBadgeLabel('<script>alert(1)</script>', 'default')).toBe('default');
      expect(sanitizeBadgeLabel('label" onload="alert(1)', 'default')).toBe('default');
      expect(sanitizeBadgeLabel('a'.repeat(60), 'default')).toBe('default');
      expect(sanitizeBadgeLabel(12345, 'default')).toBe('default');
    });
  });
});
