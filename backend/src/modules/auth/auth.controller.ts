import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  InternalServerErrorException,
  Ip,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { RegisterOAuthTokenUseCase } from '@/use-cases/tokens/RegisterOAuthTokenUseCase';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { AppDataSource } from '@/infrastructure/database/database';
import { UserMetric } from '@/infrastructure/database/entities/UserMetric';
import { logger } from '@/infrastructure/logging/logger';
import { getMessages, resolveLocale } from '@/infrastructure/i18n/backendI18n';
import { DisconnectAccountDto, GetUserMetricsQueryDto, PurgeSelfAccountDto } from './dto/auth.dto';

@Controller('api')
export class AuthController {
  constructor(
    private readonly registerOAuthUseCase: RegisterOAuthTokenUseCase,
    private readonly purgeUseCase: PurgeUserDataUseCase,
    @Inject('ITokenRepository') private readonly tokenRepo: ITokenRepository,
    @Inject('IGitHubRepository') private readonly githubRepo: IGitHubRepository
  ) {}

  @Get('auth/github')
  @Redirect()
  initiateGitHubAuth(): { url: string; statusCode: number } {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId || clientId.trim() === '') {
      throw new BadRequestException(
        'La aplicación de GitHub no está configurada en el servidor (GITHUB_CLIENT_ID). Asegúrate de configurar GITHUB_CLIENT_ID en tu archivo .env'
      );
    }

    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,repo&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}`;

    return { url: githubAuthUrl, statusCode: 302 };
  }

  @Get('auth/github/callback')
  @Redirect()
  async handleGitHubCallback(
    @Query('code') code?: string,
    @Query('error') error?: string,
    @Ip() clientIp?: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<{ url: string; statusCode: number }> {
    if (error || !code) {
      logger.warn('GitHub OAuth callback error or missing code', { error });
      return { url: '/?auth_error=denied', statusCode: 302 };
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in callback');
      return { url: '/?auth_error=not_configured', statusCode: 302 };
    }

    try {
      // 1. Exchange authorization code for token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!tokenRes.ok) {
        logger.error('GitHub token exchange failed', { status: tokenRes.status });
        return { url: '/?auth_error=exchange_failed', statusCode: 302 };
      }

      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        expires_in?: number;
        refresh_token?: string;
        scope?: string;
        error?: string;
      };

      if (!tokenData.access_token || tokenData.error) {
        logger.error('GitHub token exchange response error', { tokenData });
        return { url: '/?auth_error=token_missing', statusCode: 302 };
      }

      // 2. Fetch authenticated GitHub user login
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'User-Agent': 'github-helpers-app',
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userRes.ok) {
        logger.error('GitHub profile fetch failed with OAuth token', { status: userRes.status });
        return { url: '/?auth_error=user_fetch_failed', statusCode: 302 };
      }

      const githubUser = (await userRes.json()) as { login?: string };
      if (!githubUser.login) {
        return { url: '/?auth_error=invalid_user', statusCode: 302 };
      }

      const username = githubUser.login;
      const ip = clientIp ?? '';
      const agent = userAgent ?? '';

      // 3. Register OAuth token securely
      await this.registerOAuthUseCase.execute({
        username,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        tokenType: 'app_user',
        ip,
        userAgent: agent,
      });

      logger.info(`GitHub App OAuth login successful for user ${username}`, { username });
      return { url: `/?auth_success=1&username=${encodeURIComponent(username)}`, statusCode: 302 };
    } catch (err: unknown) {
      logger.error('Error during GitHub OAuth callback processing', { error: err });
      return { url: '/?auth_error=server_error', statusCode: 302 };
    }
  }

  @Get('users/me/metrics')
  async getUserMetrics(@Query() query: GetUserMetricsQueryDto): Promise<Record<string, unknown>> {
    const m = getMessages(resolveLocale(query.locale));
    const username = query.username.toLowerCase();

    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      const metricEntity = await userMetricRepo.findOneBy({ username });
      const tokenInfo = await this.tokenRepo.getToken(username);

      return {
        username: query.username,
        connected: Boolean(tokenInfo),
        tokenType: tokenInfo?.token_type ?? 'none',
        expiresAt: tokenInfo?.expires_at ?? null,
        scopes: tokenInfo?.scopes ?? null,
        updatedAt: tokenInfo?.updated_at ?? null,
        metrics: {
          profile_views: metricEntity?.profile_views ?? 0,
          stats_renders: (metricEntity?.stats_web ?? 0) + (metricEntity?.stats_github ?? 0),
          languages_renders: (metricEntity?.languages_web ?? 0) + (metricEntity?.languages_github ?? 0),
          repo_renders: (metricEntity?.repo_web ?? 0) + (metricEntity?.repo_github ?? 0),
          rank_renders: (metricEntity?.rank_web ?? 0) + (metricEntity?.rank_github ?? 0),
          streak_renders: (metricEntity?.streak_web ?? 0) + (metricEntity?.streak_github ?? 0),
          trophies_renders: (metricEntity?.trophies_web ?? 0) + (metricEntity?.trophies_github ?? 0),
          sponsors_renders: (metricEntity?.sponsors_web ?? 0) + (metricEntity?.sponsors_github ?? 0),
          commit_activity_renders: (metricEntity?.commit_activity_web ?? 0) + (metricEntity?.commit_activity_github ?? 0),
          last_updated: metricEntity?.last_updated ?? null,
        },
      };
    } catch (error: unknown) {
      logger.error(`Error fetching metrics for user ${query.username}`, { username: query.username, error });
      throw new InternalServerErrorException(m.userMetricsFetchError);
    }
  }

  @Delete('users/me')
  async deleteUserAccount(@Query() query: PurgeSelfAccountDto): Promise<{ message: string }> {
    const m = getMessages(resolveLocale(query.locale));
    const username = query.username.toLowerCase();

    try {
      await this.purgeUseCase.execute(username);
      this.githubRepo.clearCache(username);
      logger.info(`User account ${query.username} purged self successfully via UI`, { username: query.username });
      return { message: m.purgeSuccess };
    } catch (error: unknown) {
      logger.error(`Error purging user account ${query.username}`, { username: query.username, error });
      throw new InternalServerErrorException(m.purgeDataError);
    }
  }

  @Post('auth/disconnect')
  async disconnectAccount(@Body() dto: DisconnectAccountDto): Promise<{ message: string }> {
    const m = getMessages(resolveLocale(dto.locale));
    const username = dto.username.toLowerCase();

    try {
      await this.tokenRepo.deleteToken(username);
      this.githubRepo.clearCache(username);
      logger.info(`Disconnected GitHub account for user ${dto.username}`, { username: dto.username });
      return { message: m.accountDisconnectSuccess };
    } catch (error: unknown) {
      logger.error(`Error disconnecting GitHub account for user ${dto.username}`, { username: dto.username, error });
      throw new InternalServerErrorException(m.tokenRevokeError);
    }
  }
}
