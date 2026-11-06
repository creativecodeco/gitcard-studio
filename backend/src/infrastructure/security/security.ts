import crypto from 'node:crypto';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { logger } from '@/infrastructure/logging/logger';

const ALGORITHM = 'aes-256-gcm';

/**
 * Compare two strings in constant time to prevent timing attacks
 */
export function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

// Derive a secure 32-byte key from the environment variable
function getEncryptionKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (
    !rawKey ||
    rawKey === 'default-fallback-key-change-me-in-production-creativecode' ||
    rawKey.trim().length < 32
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable is not defined, uses default fallback, or is shorter than 32 characters in production mode.'
      );
    }
  }
  const keyToUse = rawKey || 'default-fallback-key-change-me-in-production-creativecode';
  return crypto.createHash('sha256').update(keyToUse).digest();
}

export const SESSION_COOKIE_NAME = 'gcs_session';

/**
 * Generate a stateless AES-256-GCM encrypted and authenticated session token for an authenticated user
 */
export function generateOAuthSessionToken(
  username: string,
  ttlMs: number = 30 * 24 * 60 * 60 * 1000
): string {
  const normalizedUser = username.trim().toLowerCase();
  const expiresAt = Date.now() + ttlMs;
  const payload = JSON.stringify({
    u: normalizedUser,
    exp: expiresAt,
    n: crypto.randomBytes(8).toString('hex')
  });

  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from('gcs-oauth-session-v2', 'utf8'));

  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `gcss_v2.${iv.toString('hex')}.${encrypted}.${authTag}`;
}

/**
 * Decrypt and authenticate an AES-256-GCM session token, returning its payload if valid and unexpired
 */
export function decryptOAuthSessionToken(
  token: string
): { username: string; expiresAt: number } | null {
  if (!token || typeof token !== 'string' || !token.startsWith('gcss_')) {
    return null;
  }

  if (!token.startsWith('gcss_v2.')) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 4) {
    return null;
  }

  const [, ivHex, encryptedHex, authTagHex] = parts;
  if (!ivHex || !encryptedHex || !authTagHex || ivHex.length !== 24 || authTagHex.length !== 32) {
    return null;
  }

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('gcs-oauth-session-v2', 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const parsed = JSON.parse(decrypted) as { u?: string; exp?: number };
    if (
      !parsed ||
      typeof parsed.u !== 'string' ||
      !parsed.u.trim() ||
      typeof parsed.exp !== 'number' ||
      !Number.isFinite(parsed.exp) ||
      parsed.exp <= Date.now()
    ) {
      return null;
    }

    return {
      username: parsed.u.trim().toLowerCase(),
      expiresAt: parsed.exp
    };
  } catch {
    return null;
  }
}

/**
 * Verify a stateless AES-256-GCM session token for a target username
 */
export function verifyOAuthSessionToken(token: string, expectedUsername: string): boolean {
  if (!expectedUsername || typeof expectedUsername !== 'string') {
    return false;
  }

  const session = decryptOAuthSessionToken(token);
  if (!session) {
    return false;
  }

  const normalizedExpected = expectedUsername.trim().toLowerCase();
  return safeTimingEqual(session.username, normalizedExpected);
}

/**
 * Build an HttpOnly, SameSite=Lax, Secure (in prod) Set-Cookie header value for the session token
 */
export function buildSessionCookieHeader(
  sessionToken: string,
  maxAgeSeconds: number = 30 * 24 * 60 * 60
): string {
  const isProd = process.env.NODE_ENV === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secureFlag}`;
}

/**
 * Build a Set-Cookie header that immediately expires and clears the session cookie
 */
export function buildClearSessionCookieHeader(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`;
}

/**
 * Extract the encrypted session token from a raw Cookie HTTP header
 */
export function extractSessionTokenFromCookie(cookieHeader?: string): string | undefined {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return undefined;
  }

  const cookies = cookieHeader.split(';');
  for (const part of cookies) {
    const eqIdx = part.indexOf('=');
    if (eqIdx <= 0) continue;
    const name = part.slice(0, eqIdx).trim();
    if (name === SESSION_COOKIE_NAME) {
      const rawVal = part.slice(eqIdx + 1).trim();
      if (!rawVal) return undefined;
      try {
        return decodeURIComponent(rawVal);
      } catch {
        return rawVal;
      }
    }
  }

  return undefined;
}

/**
 * Encrypt a GitHub Personal Access Token using AES-256-GCM (versioned v1 format)
 */
export function encryptToken(token: string): { encryptedToken: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedToken: `v1:${encrypted}:${authTag}`,
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt a GitHub Personal Access Token using AES-256-GCM (supports v1 and legacy formats)
 */
export function decryptToken(encryptedText: string, ivHex: string): string {
  const parts = encryptedText.split(':');
  const encrypted = parts.length === 3 && parts[0] === 'v1' ? parts[1] : parts[0];
  const authTagHex = parts.length === 3 && parts[0] === 'v1' ? parts[2] : parts[1];
  if (!encrypted || !authTagHex) {
    throw new Error('Formato de token cifrado inválido.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const key = getEncryptionKey();
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a secure fingerprint for consent audit based on client IP and User-Agent
 */
export function generateConsentFingerprint(
  ip: string = 'unknown-ip',
  userAgent: string = 'unknown-ua'
): string {
  return crypto
    .createHash('sha256')
    .update(`${ip || 'unknown-ip'}-${userAgent || 'unknown-ua'}`)
    .digest('hex');
}

/**
 * Validate that the provided token is valid, belongs to the expected user (if specified),
 * and does not have dangerous write/admin permissions
 */
export async function validateTokenScopes(
  token: string,
  expectedUsername?: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // 1. Verify token validity by requesting user profile info
    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        'User-Agent': 'gitcard-studio-security',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${token}`
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!profileRes.ok) {
      if (profileRes.status === 401) {
        return { valid: false, reason: 'El token proporcionado no es válido o ha expirado.' };
      }
      return {
        valid: false,
        reason: `GitHub API error (${profileRes.status}): ${profileRes.statusText}`
      };
    }

    const profileData = (await profileRes.json().catch(() => null)) as { login?: string } | null;
    if (
      expectedUsername &&
      profileData?.login &&
      profileData.login.toLowerCase() !== expectedUsername.trim().toLowerCase()
    ) {
      return {
        valid: false,
        reason: `El token proporcionado pertenece a @${profileData.login} y no coincide con el usuario @${expectedUsername}.`
      };
    }

    // 2. Read scopes header (available for Classic PATs)
    const scopesHeader = profileRes.headers.get('x-oauth-scopes');
    if (scopesHeader) {
      const scopes = scopesHeader.split(',').map((s) => s.trim().toLowerCase());

      const dangerousScopes = new Set([
        'repo',
        'write:repo_hook',
        'write:org',
        'write:public_key',
        'write:repo_gpg_key',
        'admin:org',
        'admin:repo_hook',
        'admin:org_hook',
        'delete_repo'
      ]);

      const hasDangerous = scopes.some(
        (scope) =>
          dangerousScopes.has(scope) ||
          scope.startsWith('write:') ||
          scope.includes('delete') ||
          scope.includes('admin')
      );

      if (hasDangerous) {
        return {
          valid: false,
          reason:
            'El token provisto tiene permisos de escritura o administración peligrosos. Por favor, crea un token con los permisos mínimos requeridos (solo lectura de perfil).'
        };
      }
    }

    // 3. Probing verification (Dry-run) for Fine-Grained PATs (since they don't return scopes header)
    // We attempt a repository creation request (POST /user/repos) with an empty body.
    // - If the token is read-only (Metadata), GitHub will block it at the authorization layer and return 403 Forbidden/404.
    // - If the token has write/create repository permissions, the request gets through authorization and returns 422 Unprocessable Entity (missing 'name').
    const probeRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'User-Agent': 'gitcard-studio-security',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${token}`
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(8000)
    });

    // If it responds with 422, it means the token had authorization to write, which we want to reject
    if (probeRes.status === 422) {
      return {
        valid: false,
        reason:
          'Se detectaron permisos de creación/escritura de repositorios en el token. Por favor, asegúrate de que el token sea de solo lectura.'
      };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Error validating token scopes', { error });
    return {
      valid: false,
      reason: 'Error al comunicarse con la API de GitHub durante la validación.'
    };
  }
}

export async function getDecryptedRefreshToken(tokenInfo: {
  encrypted_refresh_token?: string;
  refresh_token_iv?: string;
}): Promise<string | undefined> {
  if (!tokenInfo.encrypted_refresh_token || !tokenInfo.refresh_token_iv) {
    return undefined;
  }
  try {
    return decryptToken(tokenInfo.encrypted_refresh_token, tokenInfo.refresh_token_iv);
  } catch (e) {
    logger.warn('Could not decrypt refresh token', { error: e });
    return undefined;
  }
}

const inFlightTokenRefreshes = new Map<string, Promise<string | undefined>>();

export async function refreshGitHubAppToken(
  username: string,
  refreshToken: string,
  tokenRepo: ITokenRepository
): Promise<string | undefined> {
  const userKey = username.trim().toLowerCase();
  const existingRefresh = inFlightTokenRefreshes.get(userKey);
  if (existingRefresh) {
    return existingRefresh;
  }

  const refreshPromise = (async (): Promise<string | undefined> => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.warn('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET for refreshing token');
      return undefined;
    }

    try {
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) {
        logger.error('Failed to refresh GitHub App token', { status: res.status });
        return undefined;
      }

      const data = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
        refresh_token?: string;
        scope?: string;
        error?: string;
        error_description?: string;
      };

      if (data.error || !data.access_token) {
        logger.warn('GitHub App token refresh response did not contain access_token', {
          error: data.error,
          error_description: data.error_description
        });
        if (
          data.error === 'bad_refresh_token' ||
          data.error === 'bad_verification_code' ||
          data.error === 'incorrect_client_credentials'
        ) {
          logger.warn(`Purging unrefreshable token for user ${username} due to ${data.error}`);
          await tokenRepo.deleteToken(username).catch((err) => {
            logger.error(`Error deleting unrefreshable token for ${username}`, { error: err });
          });
        }
        return undefined;
      }

      const encToken = encryptToken(data.access_token);
      let encRefresh: { encryptedToken: string; iv: string } | undefined;
      if (data.refresh_token) {
        encRefresh = encryptToken(data.refresh_token);
      }

      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : undefined;

      const existingInfo = await tokenRepo.getToken(username);
      await tokenRepo.saveToken({
        username,
        encryptedToken: encToken.encryptedToken,
        iv: encToken.iv,
        consentAccepted: existingInfo ? existingInfo.consent_accepted === 1 : true,
        consentDate: existingInfo?.consent_date ?? new Date().toISOString(),
        consentFingerprint: existingInfo?.consent_fingerprint ?? 'system-refresh',
        tokenType: 'app_user',
        encryptedRefreshToken: encRefresh?.encryptedToken,
        refreshTokenIv: encRefresh?.iv,
        expiresAt,
        scopes: data.scope ?? existingInfo?.scopes
      });

      logger.info(`Refreshed GitHub App token for user ${username}`);
      return data.access_token;
    } catch (error) {
      logger.error(`Error refreshing GitHub App token for user ${username}`, { error });
      return undefined;
    }
  })().finally(() => {
    inFlightTokenRefreshes.delete(userKey);
  });

  inFlightTokenRefreshes.set(userKey, refreshPromise);
  return refreshPromise;
}

export async function getDecryptedToken(
  username: string,
  tokenRepo: ITokenRepository
): Promise<string | undefined> {
  try {
    const tokenInfo = await tokenRepo.getToken(username);
    if (!tokenInfo) return undefined;

    // Check if token is expired or close to expiration (within 5 minutes)
    if (tokenInfo.expires_at && tokenInfo.token_type === 'app_user') {
      const expiresTime = new Date(tokenInfo.expires_at).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() + fiveMinutes >= expiresTime) {
        const refreshToken = await getDecryptedRefreshToken(tokenInfo);
        if (refreshToken) {
          const freshAccessToken = await refreshGitHubAppToken(username, refreshToken, tokenRepo);
          if (freshAccessToken) {
            return freshAccessToken;
          }
        }

        if (Date.now() >= expiresTime) {
          logger.warn(
            `Token for user ${username} is expired and token refresh failed. Purging invalid token.`
          );
          await tokenRepo.deleteToken(username).catch((err) => {
            logger.error(`Error deleting expired token for ${username}`, { error: err });
          });
          return undefined;
        }
      }
    }

    return decryptToken(tokenInfo.encrypted_token, tokenInfo.iv);
  } catch (e) {
    logger.warn(`Could not decrypt token for user ${username}`, { username, error: e });
  }
  return undefined;
}
