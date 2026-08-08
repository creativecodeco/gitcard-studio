import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { encryptToken, generateConsentFingerprint } from '@/infrastructure/security/security';

export class RegisterOAuthTokenUseCase {
  constructor(
    private readonly tokenRepo: ITokenRepository,
    private readonly githubRepo: IGitHubRepository
  ) {}

  async execute(params: {
    username: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
    tokenType?: string;
    ip: string;
    userAgent: string;
  }): Promise<{ message: string; username: string }> {
    const { username, accessToken, refreshToken, expiresIn, scope, tokenType, ip, userAgent } = params;

    const { encryptedToken, iv } = encryptToken(accessToken);
    let encRefresh: { encryptedToken: string; iv: string } | undefined;

    if (refreshToken) {
      encRefresh = encryptToken(refreshToken);
    }

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined;
    const fingerprint = generateConsentFingerprint(ip, userAgent);
    const consentDate = new Date().toISOString();

    await this.tokenRepo.saveToken({
      username,
      encryptedToken,
      iv,
      consentAccepted: true,
      consentDate,
      consentFingerprint: fingerprint,
      tokenType: tokenType ?? 'app_user',
      encryptedRefreshToken: encRefresh?.encryptedToken,
      refreshTokenIv: encRefresh?.iv,
      expiresAt,
      scopes: scope
    });

    // Clear caches to force reloading with the new OAuth token
    this.githubRepo.clearCache(username);

    return {
      message: 'Cuenta de GitHub vinculada exitosamente. Tus métricas públicas y privadas se actualizarán en tus tarjetas.',
      username
    };
  }
}
