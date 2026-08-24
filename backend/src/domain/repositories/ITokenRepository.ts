import { UserToken } from '../entities/UserToken';

export interface SaveTokenParams {
  username: string;
  encryptedToken: string;
  iv: string;
  consentAccepted: boolean;
  consentDate: string;
  consentFingerprint: string;
  tokenType?: string;
  encryptedRefreshToken?: string;
  refreshTokenIv?: string;
  expiresAt?: string;
  scopes?: string;
}

export interface ITokenRepository {
  saveToken(params: SaveTokenParams): Promise<void>;
  getToken(username: string): Promise<UserToken | null>;
  deleteToken(username: string): Promise<void>;
}
