import { Controller, Get, Headers, Ip, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { GetUserStatsCardUseCase } from '@/use-cases/cards/GetUserStatsCardUseCase';
import { GetUserLanguagesCardUseCase } from '@/use-cases/cards/GetUserLanguagesCardUseCase';
import { GetFeaturedRepoCardUseCase } from '@/use-cases/cards/GetFeaturedRepoCardUseCase';
import { GetUserRankCardUseCase } from '@/use-cases/cards/GetUserRankCardUseCase';
import { GetUserStreakCardUseCase } from '@/use-cases/cards/GetUserStreakCardUseCase';
import { GetUserTrophiesCardUseCase } from '@/use-cases/cards/GetUserTrophiesCardUseCase';
import { GetUserTopReposCardUseCase } from '@/use-cases/cards/GetUserTopReposCardUseCase';
import { GetUserSponsorsCardUseCase } from '@/use-cases/cards/GetUserSponsorsCardUseCase';
import { GetUserCommitActivityCardUseCase } from '@/use-cases/cards/GetUserCommitActivityCardUseCase';
import { RecordProfileViewUseCase } from '@/use-cases/metrics/RecordProfileViewUseCase';
import { renderViewsBadge } from '@/adapters/presenters/viewsBadge';
import { renderErrorCard } from '@/adapters/presenters/errorCard';
import { renderBadgeSVG } from '@/adapters/presenters/badge.presenter';
import { renderTodayStatusBadge } from '@/adapters/presenters/todayStatusBadge.presenter';
import { renderTimelineMatrixCard } from '@/adapters/presenters/timelineMatrixCard';
import { GITHUB_USERNAME_REGEX, GITHUB_REPO_REGEX } from '@/domain/entities/Validation';
import { HitContext } from '@/domain/entities/Metrics';
import { logger } from '@/infrastructure/logging/logger';
import { sanitizeColor } from '@/adapters/presenters/theme';
import { escapeXml } from '@/utils/escape';
import { extractThemeOverrides, extractCardWidth } from './card-query.helpers';

@Controller('api')
export class CardsController {
  constructor(
    private readonly statsCardUseCase: GetUserStatsCardUseCase,
    private readonly languagesCardUseCase: GetUserLanguagesCardUseCase,
    private readonly repoCardUseCase: GetFeaturedRepoCardUseCase,
    private readonly rankCardUseCase: GetUserRankCardUseCase,
    private readonly streakCardUseCase: GetUserStreakCardUseCase,
    private readonly trophiesCardUseCase: GetUserTrophiesCardUseCase,
    private readonly recordProfileViewUseCase: RecordProfileViewUseCase,
    private readonly topReposCardUseCase: GetUserTopReposCardUseCase,
    private readonly sponsorsCardUseCase: GetUserSponsorsCardUseCase,
    private readonly commitActivityCardUseCase: GetUserCommitActivityCardUseCase
  ) {}

  private async handleCardRequest(
    query: Record<string, unknown>,
    userAgent: string | undefined,
    referer: string | undefined,
    ip: string,
    res: FastifyReply,
    cardName: string,
    executeUseCase: (
      username: string,
      theme: string,
      overrides: Record<string, string>,
      hitContext?: HitContext
    ) => Promise<string>
  ): Promise<string> {
    res.type('image/svg+xml');
    const username = query.username;
    const theme = query.theme;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.status(400);
      return renderErrorCard('Usuario de GitHub inválido');
    }

    try {
      const cardWidth = extractCardWidth(query);
      const overrides = {
        ...extractThemeOverrides(query),
        ...(cardWidth ? { cardWidth } : {}),
      };
      const hitContext: HitContext = {
        username,
        userAgent,
        referer,
        ip,
      };

      const svg = await executeUseCase(username, theme as string, overrides, hitContext);

      res
        .header('Cache-Control', 'public, max-age=7200')
        .status(200);
      return svg;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener datos';
      logger.error(`Error rendering card ${cardName} for user ${username}`, { cardName, username, error });
      res.status(500);
      return renderErrorCard(message);
    }
  }

  @Get('stats')
  async getStats(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'Stats', (u, t, o, h) =>
      this.statsCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('languages')
  async getLanguages(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'Languages', (u, t, o, h) =>
      this.languagesCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('repo')
  async getRepo(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    res.type('image/svg+xml');
    const repo = query.repo;

    if (repo && (typeof repo !== 'string' || !GITHUB_REPO_REGEX.test(repo))) {
      res.status(400);
      return renderErrorCard('Repositorio de GitHub inválido');
    }

    return this.handleCardRequest(query, userAgent, referer, ip, res, 'Repo', (u, t, o, h) =>
      this.repoCardUseCase.execute(u, repo as string | undefined, t, o, h)
    );
  }

  @Get('rank')
  async getRank(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'Rank', (u, t, o, h) =>
      this.rankCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('streak')
  async getStreak(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'Streak', (u, t, o, h) =>
      this.streakCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('trophies')
  async getTrophies(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'Trophies', (u, t, o, h) =>
      this.trophiesCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('views')
  async getProfileViews(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    res.type('image/svg+xml');
    const { username, theme, color, label, style, preview } = query;

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      res.status(400);
      return renderErrorCard('Usuario de GitHub inválido');
    }

    try {
      const isPreview = preview === 'true' || preview === '1';
      const hitContext: HitContext = { username, userAgent, referer, ip };

      const viewsCount = await this.recordProfileViewUseCase.execute(username, userAgent, referer, isPreview, hitContext);

      const cleanLabel = typeof label === 'string' ? label : undefined;
      const cleanColor = typeof color === 'string' ? color : undefined;
      const cleanTheme = typeof theme === 'string' ? theme : undefined;
      const cleanStyle = typeof style === 'string' ? style : undefined;

      const svg = renderViewsBadge(viewsCount, cleanLabel, cleanColor, cleanTheme, cleanStyle);

      res
        .header('Cache-Control', 'max-age=0, s-maxage=0, no-cache, no-store, must-revalidate')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .status(200);

      return svg;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener visitas';
      logger.error(`Error in getProfileViews for user ${username}`, { username, error });
      res.status(500);
      return renderErrorCard(message);
    }
  }

  @Get('top-repos')
  async getTopRepos(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'TopRepos', (u, t, o) =>
      this.topReposCardUseCase.execute(u, t, o)
    );
  }

  @Get('sponsors')
  async getSponsors(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'Sponsors', (u, t, o, h) =>
      this.sponsorsCardUseCase.execute(u, t, o, h)
    );
  }

  @Get('commit-activity')
  async getCommitActivity(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    const cardWidth = extractCardWidth(query);
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'CommitActivity', (u, t, o, h) =>
      this.commitActivityCardUseCase.execute(u, t, o, cardWidth, h)
    );
  }

  @Get('today-status')
  async getTodayStatus(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    res.type('image/svg+xml');
    const rawUsername = query.username;
    if (!rawUsername || typeof rawUsername !== 'string' || !GITHUB_USERNAME_REGEX.test(rawUsername.trim())) {
      res.status(400);
      return renderErrorCard('Usuario de GitHub inválido');
    }

    const username = rawUsername.trim();
    const rawTheme = typeof query.theme === 'string' ? query.theme : 'dark';
    const theme = escapeXml(rawTheme.trim());
    const overrides = extractThemeOverrides(query);

    res.header('Content-Type', 'image/svg+xml')
       .header('Cache-Control', 'public, max-age=7200, s-maxage=7200');

    return renderTodayStatusBadge({ username, commitsToday: 3 }, { theme, overrides });
  }

  @Get('timeline-matrix')
  async getTimelineMatrix(
    @Query() query: Record<string, unknown>,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    const cardWidth = extractCardWidth(query);
    return this.handleCardRequest(query, userAgent, referer, ip, res, 'TimelineMatrix', async (u, t, o) => {
      return renderTimelineMatrixCard({ username: u }, { theme: t, overrides: o, cardWidth });
    });
  }

  @Get('badge')
  async getBadge(
    @Query() query: Record<string, unknown>,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<string> {
    res.type('image/svg+xml');
    const rawUsername = query.username;
    if (!rawUsername || typeof rawUsername !== 'string' || !GITHUB_USERNAME_REGEX.test(rawUsername.trim())) {
      res.status(400);
      return renderBadgeSVG({ label: 'gitcard studio', value: 'invalid user', valueColor: '#ef4444' });
    }

    const username = rawUsername.trim();
    const type = typeof query.type === 'string' ? query.type : 'views';
    const rawColor = typeof query.color === 'string' ? query.color : undefined;
    const color = sanitizeColor(rawColor) || '#38bdf8';

    let defaultLabel = 'gitcard studio';
    if (type === 'views') {
      defaultLabel = 'profile views';
    }
    const rawLabel = typeof query.label === 'string' ? query.label.trim() : defaultLabel;
    const label = escapeXml(rawLabel);

    let value = '1';
    if (type === 'views') {
      const views = await this.recordProfileViewUseCase.execute(username, undefined, undefined, true);
      value = String(views);
    }

    res.header('Content-Type', 'image/svg+xml')
       .header('Cache-Control', 'public, max-age=3600, s-maxage=3600');

    return renderBadgeSVG({ label, value, valueColor: color });
  }
}
