import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Headers,
  Inject,
  InternalServerErrorException,
  Ip,
  Post,
  UnauthorizedException
} from '@nestjs/common';
import { RegisterUserTokenUseCase } from '@/use-cases/tokens/RegisterUserTokenUseCase';
import { RevokeUserTokenUseCase } from '@/use-cases/tokens/RevokeUserTokenUseCase';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';
import {
  ExportUserDataUseCase,
  UserDataExportResult
} from '@/use-cases/users/ExportUserDataUseCase';
import { logger } from '@/infrastructure/logging/logger';
import { escapeXml } from '@/utils/escape';
import { getMessages, resolveLocale } from '@/infrastructure/i18n/backendI18n';
import { RegisterTokenDto, RevokeTokenDto, PurgeUserDto, ExportUserDto } from './dto/tokens.dto';

import { getDecryptedToken } from '@/infrastructure/security/security';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';

export function extractBearerToken(authHeader?: string, bodyToken?: string): string | undefined {
  const raw = authHeader ?? bodyToken;
  if (typeof raw !== 'string') return undefined;
  if (raw.startsWith('Bearer ')) return raw.slice(7);
  if (raw.startsWith('token ')) return raw.slice(6);
  return raw;
}

@Controller('api')
export class TokensController {
  constructor(
    @Inject(RegisterUserTokenUseCase) private readonly registerUseCase: RegisterUserTokenUseCase,
    @Inject(RevokeUserTokenUseCase) private readonly revokeUseCase: RevokeUserTokenUseCase,
    @Inject(PurgeUserDataUseCase) private readonly purgeUseCase: PurgeUserDataUseCase,
    @Inject(ExportUserDataUseCase) private readonly exportUseCase: ExportUserDataUseCase,
    @Inject('IGitHubRepository') private readonly githubRepo: IGitHubRepository,
    @Inject('ITokenRepository') private readonly tokenRepo: ITokenRepository
  ) {}

  @Post('tokens/register')
  async register(
    @Body() dto: RegisterTokenDto,
    @Headers('authorization') _authHeader?: string,
    @Headers('user-agent') userAgent?: string,
    @Ip() clientIp?: string
  ): Promise<Record<string, unknown>> {
    const m = getMessages(resolveLocale(dto.locale));

    if (!dto.consentAccepted) {
      throw new BadRequestException(m.consentRequired);
    }

    try {
      // Fastify's @Ip() decorator resolves the IP from the underlying socket,
      // which is the authoritative source and cannot be spoofed by client headers.
      const ip = clientIp ?? '';
      const agent = userAgent ?? '';
      const result = await this.registerUseCase.execute(
        dto.username,
        dto.token,
        dto.consentAccepted,
        ip,
        agent
      );
      this.githubRepo.clearCache(dto.username);
      logger.info(`Token registered successfully for user ${dto.username}`, {
        username: dto.username
      });
      return result as Record<string, unknown>;
    } catch (error: unknown) {
      logger.error(`Error registering token for user ${dto.username}`, {
        username: dto.username,
        error
      });
      throw new InternalServerErrorException(m.tokenRegisterError);
    }
  }

  @Delete('tokens/revoke')
  async revoke(
    @Body() dto: RevokeTokenDto,
    @Headers('authorization') authHeader?: string
  ): Promise<Record<string, unknown>> {
    const m = getMessages(resolveLocale(dto.locale));
    const providedToken = extractBearerToken(authHeader, dto.token);

    if (!providedToken || providedToken.trim() === '') {
      throw new BadRequestException(m.tokenIdentityRequired);
    }

    try {
      const result = await this.revokeUseCase.execute(dto.username, providedToken);
      this.githubRepo.clearCache(dto.username);
      logger.info(`Token revoked successfully for user ${dto.username}`, {
        username: dto.username
      });
      return result as Record<string, unknown>;
    } catch (error: unknown) {
      logger.error(`Error revoking token for user ${dto.username}`, {
        username: dto.username,
        error
      });
      throw new InternalServerErrorException(m.tokenRevokeError);
    }
  }

  @Delete('users/purge')
  async purge(
    @Body() dto: PurgeUserDto,
    @Headers('authorization') authHeader?: string
  ): Promise<{ message: string }> {
    const m = getMessages(resolveLocale(dto.locale));
    const providedToken = extractBearerToken(authHeader, dto.token);

    if (!providedToken || providedToken.trim() === '') {
      throw new BadRequestException(m.purgeTokenRequired);
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        'User-Agent': 'gitcard-studio-security',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${providedToken}`
      }
    });

    if (!profileRes.ok) {
      throw new UnauthorizedException(m.tokenExpiredOrInvalid);
    }

    const githubUser = (await profileRes.json()) as { login: string };
    const tokenOwner = githubUser.login;

    if (tokenOwner.toLowerCase() !== dto.username.toLowerCase()) {
      throw new ForbiddenException(m.accessDenied(escapeXml(tokenOwner), escapeXml(dto.username)));
    }

    try {
      await this.purgeUseCase.execute(dto.username);
      this.githubRepo.clearCache(dto.username);
      logger.info(`GDPR data purge completed for user ${dto.username}`, { username: dto.username });
      return { message: m.purgeSuccess };
    } catch (error: unknown) {
      logger.error(`Error purging data for user ${dto.username}`, {
        username: dto.username,
        error
      });
      throw new InternalServerErrorException(m.purgeDataError);
    }
  }

  @Post('users/export')
  async exportData(
    @Body() dto: ExportUserDto,
    @Headers('authorization') authHeader?: string
  ): Promise<UserDataExportResult> {
    const m = getMessages(resolveLocale(dto.locale));
    let providedToken = extractBearerToken(authHeader, dto.token);

    if (!providedToken || providedToken.trim() === '') {
      providedToken = await getDecryptedToken(dto.username, this.tokenRepo);
    }

    if (!providedToken || providedToken.trim() === '') {
      throw new BadRequestException(m.exportTokenRequired);
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        'User-Agent': 'gitcard-studio-security',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${providedToken}`
      }
    });

    if (!profileRes.ok) {
      throw new UnauthorizedException(m.tokenExpiredOrInvalid);
    }

    const githubUser = (await profileRes.json()) as { login: string };
    const tokenOwner = githubUser.login;

    if (tokenOwner.toLowerCase() !== dto.username.toLowerCase()) {
      throw new ForbiddenException(m.accessDenied(escapeXml(tokenOwner), escapeXml(dto.username)));
    }

    try {
      const data = await this.exportUseCase.execute(dto.username);
      logger.info(`Data export generated for user ${dto.username}`, { username: dto.username });
      return data;
    } catch (error: unknown) {
      logger.error(`Error exporting data for user ${dto.username}`, {
        username: dto.username,
        error
      });
      throw new InternalServerErrorException(m.exportDataError);
    }
  }
}
