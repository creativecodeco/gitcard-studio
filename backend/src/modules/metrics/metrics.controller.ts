import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  InternalServerErrorException,
  Optional,
  Post,
  Query,
  UnauthorizedException
} from '@nestjs/common';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { safeTimingEqual } from '@/infrastructure/security/security';
import { logger } from '@/infrastructure/logging/logger';
import { getMessages, resolveLocale, SupportedLocale } from '@/infrastructure/i18n/backendI18n';
import {
  MetricsHistoryQueryDto,
  MetricsKeyQueryDto,
  VerifyReadmeDto,
  VerifyReadmesBatchDto
} from './dto/metrics.dto';
import { VerifyUserReadmeUseCase } from '@/use-cases/metrics/VerifyUserReadmeUseCase';

@Controller('api')
export class MetricsController {
  constructor(
    @Inject('IMetricsRepository') private readonly metricsRepo: IMetricsRepository,
    @Optional()
    @Inject(VerifyUserReadmeUseCase)
    private readonly verifyUserReadmeUseCase?: VerifyUserReadmeUseCase
  ) {}

  private validateMetricsKey(
    queryKey?: string,
    headerKey?: string,
    locale?: SupportedLocale
  ): void {
    const m = getMessages(resolveLocale(locale));
    const expectedKey = process.env.METRICS_KEY;

    if (!expectedKey) {
      throw new ForbiddenException(m.metricsDisabled);
    }

    const providedKey = headerKey ?? queryKey;

    if (typeof providedKey !== 'string' || !safeTimingEqual(providedKey, expectedKey)) {
      throw new UnauthorizedException(m.metricsUnauthorized);
    }
  }

  @Get('metrics')
  async getMetrics(
    @Query() query: MetricsKeyQueryDto,
    @Headers('x-api-key') headerKey?: string
  ): Promise<unknown> {
    this.validateMetricsKey(query.key, headerKey, query.locale);
    return await this.metricsRepo.getMetrics();
  }

  @Get('metrics/history')
  async getRendersHistory(
    @Query() query: MetricsHistoryQueryDto,
    @Headers('x-api-key') headerKey?: string
  ): Promise<unknown> {
    this.validateMetricsKey(query.key, headerKey, query.locale);

    try {
      const days = query.days ?? 7;
      return await this.metricsRepo.getRendersHistory(days);
    } catch (error: unknown) {
      logger.error('Error in getRendersHistory endpoint', { error });
      throw new InternalServerErrorException(getMessages('es').metricsHistoryError);
    }
  }

  @Get('metrics/breakdown')
  async getBreakdownMetrics(
    @Query() query: MetricsKeyQueryDto,
    @Headers('x-api-key') headerKey?: string
  ): Promise<unknown> {
    this.validateMetricsKey(query.key, headerKey, query.locale);

    try {
      return await this.metricsRepo.getBreakdownMetrics();
    } catch (error: unknown) {
      logger.error('Error in getBreakdownMetrics endpoint', { error });
      throw new InternalServerErrorException('Error al obtener desglose de métricas');
    }
  }

  @Get('metrics/users')
  async getUserMetrics(
    @Query() query: MetricsKeyQueryDto,
    @Headers('x-api-key') headerKey?: string
  ): Promise<unknown> {
    this.validateMetricsKey(query.key, headerKey, query.locale);

    try {
      return await this.metricsRepo.getAllUserMetrics();
    } catch (error: unknown) {
      logger.error('Error in getUserMetrics endpoint', { error });
      throw new InternalServerErrorException(getMessages('es').userMetricsError);
    }
  }

  @Get('metrics/users/count')
  async getUniqueUsersCount(): Promise<unknown> {
    try {
      return await this.metricsRepo.getUniqueUsersCount();
    } catch (error: unknown) {
      logger.error('Error in getUniqueUsersCount endpoint', { error });
      throw new InternalServerErrorException(getMessages('es').userCountError);
    }
  }

  @Get('config')
  getConfig(): { privateStatsComingSoon: boolean } {
    return {
      privateStatsComingSoon: false
    };
  }

  @Post('metrics/verify-readme')
  async verifyUserReadme(
    @Body() body: VerifyReadmeDto,
    @Headers('x-api-key') headerKey?: string
  ): Promise<unknown> {
    this.validateMetricsKey(body.key, headerKey, body.locale);

    if (!this.verifyUserReadmeUseCase) {
      throw new InternalServerErrorException('VerifyUserReadmeUseCase is not configured');
    }

    try {
      const forceRefresh = body.forceRefresh ?? true;
      return await this.verifyUserReadmeUseCase.execute(body.username, forceRefresh);
    } catch (error: unknown) {
      logger.error('Error in verifyUserReadme endpoint', { username: body.username, error });
      throw new InternalServerErrorException('Error al verificar el README del usuario');
    }
  }

  @Post('metrics/verify-readmes-batch')
  async verifyReadmesBatch(
    @Body() body: VerifyReadmesBatchDto,
    @Headers('x-api-key') headerKey?: string
  ): Promise<unknown> {
    this.validateMetricsKey(body.key, headerKey, body.locale);

    if (!this.verifyUserReadmeUseCase) {
      throw new InternalServerErrorException('VerifyUserReadmeUseCase is not configured');
    }

    try {
      const forceRefresh = body.forceRefresh ?? true;
      return await this.verifyUserReadmeUseCase.executeBatch({
        usernames: body.usernames,
        limit: body.limit,
        forceRefresh
      });
    } catch (error: unknown) {
      logger.error('Error in verifyReadmesBatch endpoint', { error });
      throw new InternalServerErrorException('Error al auditar los READMEs de los usuarios');
    }
  }
}
