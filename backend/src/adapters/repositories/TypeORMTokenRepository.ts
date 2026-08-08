import { ITokenRepository, SaveTokenParams } from '@/domain/repositories/ITokenRepository';
import { UserToken } from '@/domain/entities/UserToken';
import { AppDataSource } from '@/infrastructure/database/database';
import { UserTokenEntity } from '@/infrastructure/database/entities/UserTokenEntity';
import { logger } from '@/infrastructure/logging/logger';

export class TypeORMTokenRepository implements ITokenRepository {
  async saveToken(params: SaveTokenParams): Promise<void> {
    const {
      username,
      encryptedToken,
      iv,
      consentAccepted,
      consentDate,
      consentFingerprint,
      tokenType = 'pat',
      encryptedRefreshToken,
      refreshTokenIv,
      expiresAt,
      scopes
    } = params;

    try {
      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);

      await tokenRepo
        .createQueryBuilder()
        .insert()
        .values({
          username: username.toLowerCase(),
          encrypted_token: encryptedToken,
          iv,
          token_type: tokenType,
          encrypted_refresh_token: encryptedRefreshToken ?? null,
          refresh_token_iv: refreshTokenIv ?? null,
          expires_at: expiresAt ? new Date(expiresAt) : null,
          scopes: scopes ?? null,
          consent_accepted: consentAccepted,
          consent_date: new Date(consentDate),
          consent_fingerprint: consentFingerprint
        })
        .orUpdate(
          [
            'encrypted_token',
            'iv',
            'token_type',
            'encrypted_refresh_token',
            'refresh_token_iv',
            'expires_at',
            'scopes',
            'consent_accepted',
            'consent_date',
            'consent_fingerprint',
            'updated_at'
          ],
          ['username']
        )
        .execute();
    } catch (err) {
      logger.error(`Error saving token for user ${username}`, { username, error: err });
      throw err;
    }
  }

  async getToken(username: string): Promise<UserToken | null> {
    try {
      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
      const entity = await tokenRepo.findOneBy({ username: username.toLowerCase() });
      if (!entity) return null;

      return {
        username: entity.username,
        encrypted_token: entity.encrypted_token,
        iv: entity.iv,
        token_type: entity.token_type ?? 'pat',
        encrypted_refresh_token: entity.encrypted_refresh_token ?? undefined,
        refresh_token_iv: entity.refresh_token_iv ?? undefined,
        expires_at: entity.expires_at ? entity.expires_at.toISOString() : undefined,
        scopes: entity.scopes ?? undefined,
        consent_accepted: entity.consent_accepted ? 1 : 0, // Map boolean to number (1/0) for domain compatibility
        consent_date: entity.consent_date.toISOString(),
        consent_fingerprint: entity.consent_fingerprint,
        updated_at: entity.updated_at.toISOString()
      };
    } catch (err) {
      logger.error(`Error getting token for user ${username}`, { username, error: err });
      return null;
    }
  }

  async deleteToken(username: string): Promise<void> {
    try {
      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
      await tokenRepo.delete({ username: username.toLowerCase() });
    } catch (err) {
      logger.error(`Error deleting token for user ${username}`, { username, error: err });
      throw err;
    }
  }
}
