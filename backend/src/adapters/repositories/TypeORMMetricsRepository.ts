import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { Metrics, HitContext } from '@/domain/entities/Metrics';
import { AppDataSource } from '@/infrastructure/database/database';
import { GlobalMetric } from '@/infrastructure/database/entities/GlobalMetric';
import { UserMetric } from '@/infrastructure/database/entities/UserMetric';
import { RequestLog } from '@/infrastructure/database/entities/RequestLog';
import { logger } from '@/infrastructure/logging/logger';

export class TypeORMMetricsRepository implements IMetricsRepository {
  recordHit(
    type: 'stats' | 'languages' | 'repo' | 'rank' | 'streak' | 'trophies' | 'views' | 'sponsors',
    context?: HitContext
  ): void {
    const username = context?.username || 'unknown';
    const userAgent = context?.userAgent || '';
    const referer = context?.referer || '';
    const ip = context?.ip || '';

    const source = this.determineTrafficSource(userAgent, referer);

    // Perform database operations in the background to not block the main request thread, matching previous SQLite repository behavior
    AppDataSource.transaction(async (transactionalEntityManager) => {
      // 1. Increment total renders
      await transactionalEntityManager
        .createQueryBuilder()
        .update(GlobalMetric)
        .set({ metric_value: () => 'metric_value + 1' })
        .where('metric_key = :key', { key: 'totalRenders' })
        .execute();

      // 2. Increment specific card type renders
      await transactionalEntityManager
        .createQueryBuilder()
        .update(GlobalMetric)
        .set({ metric_value: () => 'metric_value + 1' })
        .where('metric_key = :key', { key: `${type}Renders` })
        .execute();

      // 3. Upsert user metrics in a clean, concurrency-safe manner:
      const column = `${type}_${source}`;

      // First, insert user row if not exists (using ON CONFLICT DO NOTHING / orIgnore)
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(UserMetric)
        .values({ username: username.toLowerCase() })
        .orIgnore()
        .execute();

      // Second, increment the column and update timestamp
      await transactionalEntityManager
        .createQueryBuilder()
        .update(UserMetric)
        .set({
          [column]: () => `"${column}" + 1`,
          last_updated: new Date()
        })
        .where('username = :username', { username: username.toLowerCase() })
        .execute();

      // 4. Log the request (safely truncated to fit DB column constraints)
      const requestLogRepo = transactionalEntityManager.getRepository(RequestLog);
      const log = new RequestLog();
      log.username = username.toLowerCase().slice(0, 39);
      log.card_type = type;
      log.source = source;
      log.user_agent = userAgent.slice(0, 500);
      log.referer = referer.slice(0, 500);
      log.ip_address = ip.slice(0, 45);
      await requestLogRepo.save(log);
    }).catch((err) => {
      logger.error('Failed to record metrics hit in TypeORM:', { error: err });
    });
  }

  /**
   * Returns the global render counters read directly from the global_metrics
   * table — the source of truth that recordHit() persists to. Reading from the
   * DB (instead of a per-instance in-memory cache) guarantees the dashboard
   * reports correct totals regardless of which repository instance serves the
   * request or how many replicas are running.
   */
  async getMetrics(): Promise<Metrics> {
    const metrics: Metrics = {
      totalRenders: 0,
      statsRenders: 0,
      languagesRenders: 0,
      repoRenders: 0,
      rankRenders: 0,
      streakRenders: 0,
      trophiesRenders: 0,
      viewsRenders: 0
    };

    try {
      const globalMetricRepo = AppDataSource.getRepository(GlobalMetric);
      const rows = await globalMetricRepo.find();
      rows.forEach((row) => {
        if (row.metric_key in metrics) {
          metrics[row.metric_key as keyof Metrics] = row.metric_value;
        }
      });
    } catch (err) {
      logger.error('Error fetching global metrics:', { error: err });
    }

    return metrics;
  }

  async getUserMetrics(username: string): Promise<any> {
    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      const row = await userMetricRepo.findOneBy({ username: username.toLowerCase() });
      return row || null;
    } catch (err) {
      logger.error('Error fetching user metrics:', { username, error: err });
      return null;
    }
  }

  async getAllUserMetrics(): Promise<any[]> {
    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      return await userMetricRepo.find({
        order: { last_updated: 'DESC' }
      });
    } catch (err) {
      logger.error('Error fetching all user metrics:', { error: err });
      return [];
    }
  }

  async getUniqueUsersCount(): Promise<number> {
    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      return await userMetricRepo.count();
    } catch (err) {
      logger.error('Error fetching unique users count:', { error: err });
      return 0;
    }
  }

  async getOrIncrementProfileViews(
    username: string,
    increment: boolean,
    context?: HitContext
  ): Promise<number> {
    try {
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      const userLower = username.toLowerCase();

      // Ensure user row exists in user_metrics
      await AppDataSource.createQueryBuilder()
        .insert()
        .into(UserMetric)
        .values({ username: userLower })
        .orIgnore()
        .execute();

      if (increment) {
        await this.incrementProfileViewCounters(userLower);

        if (context) {
          await this.logProfileViewRequest(userLower, context);
        }
      }

      // Fetch current views
      const row = await userMetricRepo.findOneBy({ username: userLower });
      const currentViews = row ? row.profile_views : 0;

      if (increment) {
        logger.info(`Profile views count updated for user ${userLower}`, {
          username: userLower,
          profileViews: currentViews,
          userAgent: context?.userAgent,
          referer: context?.referer
        });
      }

      return currentViews;
    } catch (err) {
      logger.error(`Error in getOrIncrementProfileViews for user ${username}`, { username, error: err });
      return 0;
    }
  }

  async getRendersHistory(days: number): Promise<any[]> {
    try {
      const requestLogRepo = AppDataSource.getRepository(RequestLog);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Group by DATE(created_at) and select counts
      const rawResults = await requestLogRepo
        .createQueryBuilder('log')
        .select("DATE(log.created_at)", "date")
        .addSelect("COUNT(*)", "count")
        .where("log.created_at >= :cutoffDate", { cutoffDate })
        .groupBy("date")
        .orderBy("date", "ASC")
        .getRawMany();

      return rawResults.map(r => ({
        date: r.date,
        count: Number.parseInt(r.count, 10) || 0
      }));
    } catch (err) {
      logger.error('Error fetching renders history:', { days, error: err });
      return [];
    }
  }

  private determineTrafficSource(userAgent: string = '', referer: string = ''): 'github' | 'web' {
    if (/github|camo/i.test(userAgent.toLowerCase())) {
      return 'github';
    }

    if (!referer) {
      return 'web';
    }

    try {
      const host = new URL(referer).hostname.toLowerCase();
      const isGitHub =
        host === 'github.com' ||
        host.endsWith('.github.com') ||
        host === 'camo.githubusercontent.com' ||
        host.endsWith('.githubusercontent.com');
      return isGitHub ? 'github' : 'web';
    } catch {
      const isGitHub = /^(https?:\/\/)?([a-z0-9-]+\.)*(github\.com|githubusercontent\.com)(\/|$)/i.test(referer);
      return isGitHub ? 'github' : 'web';
    }
  }

  private async incrementProfileViewCounters(userLower: string): Promise<void> {
    await AppDataSource.createQueryBuilder()
      .update(GlobalMetric)
      .set({ metric_value: () => 'metric_value + 1' })
      .where('metric_key = :key', { key: 'totalRenders' })
      .execute();

    await AppDataSource.createQueryBuilder()
      .update(GlobalMetric)
      .set({ metric_value: () => 'metric_value + 1' })
      .where('metric_key = :key', { key: 'viewsRenders' })
      .execute();

    await AppDataSource.createQueryBuilder()
      .update(UserMetric)
      .set({
        profile_views: () => 'profile_views + 1',
        last_updated: new Date()
      })
      .where('username = :username', { username: userLower })
      .execute();
  }

  private async logProfileViewRequest(username: string, context: HitContext): Promise<void> {
    const userAgent = context.userAgent || '';
    const referer = context.referer || '';
    const ip = context.ip || '';
    const source = this.determineTrafficSource(userAgent, referer);

    const requestLogRepo = AppDataSource.getRepository(RequestLog);
    const log = new RequestLog();
    log.username = username.slice(0, 39);
    log.card_type = 'views';
    log.source = source;
    log.user_agent = userAgent.slice(0, 500);
    log.referer = referer.slice(0, 500);
    log.ip_address = ip.slice(0, 45);

    await requestLogRepo.save(log).catch((err) => {
      logger.error('Error saving request log for profile views:', { error: err });
    });
  }
}
