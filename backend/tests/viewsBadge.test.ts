import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, AppDataSource } from '@/infrastructure/database/database';
import { UserMetric } from '@/infrastructure/database/entities/UserMetric';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';
import { RequestLog } from '@/infrastructure/database/entities/RequestLog';
import { renderViewsBadge } from '@/adapters/presenters/viewsBadge';

describe('Profile Views Counter Badge', () => {
  let metricsRepo: TypeORMMetricsRepository;
  const testUser = `views_user_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    process.env.DB_SYNCHRONIZE = 'true';
    AppDataSource.setOptions({ synchronize: true });
    await initDatabase();
    metricsRepo = new TypeORMMetricsRepository();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      // Clean up test user metrics and logs
      const userMetricRepo = AppDataSource.getRepository(UserMetric);
      const requestLogRepo = AppDataSource.getRepository(RequestLog);
      await userMetricRepo.delete({ username: testUser });
      await requestLogRepo.delete({ username: testUser });
      await AppDataSource.destroy();
    }
  });

  it('should initialize profile_views to 0 and not increment if increment parameter is false', async (ctx) => {
    if (!AppDataSource.isInitialized) {
      ctx.skip();
      return;
    }
    const initialViews = await metricsRepo.getOrIncrementProfileViews(testUser, false);
    expect(initialViews).toBe(0);

    // Call again with increment: false, should still be 0
    const secondCallViews = await metricsRepo.getOrIncrementProfileViews(testUser, false);
    expect(secondCallViews).toBe(0);
  });

  it('should increment profile_views atomic count by 1 and save request_log when increment is true', async (ctx) => {
    if (!AppDataSource.isInitialized) {
      ctx.skip();
      return;
    }
    const hitContext = {
      username: testUser,
      userAgent: 'GitHub-Camo/1.0 (camo-proxy)',
      referer: 'https://camo.githubusercontent.com',
      ip: '127.0.0.1'
    };

    // Call with increment: true
    const viewsAfterIncrement = await metricsRepo.getOrIncrementProfileViews(
      testUser,
      true,
      hitContext
    );
    expect(viewsAfterIncrement).toBe(1);

    // Call again with increment: true
    const viewsAfterSecondIncrement = await metricsRepo.getOrIncrementProfileViews(
      testUser,
      true,
      hitContext
    );
    expect(viewsAfterSecondIncrement).toBe(2);

    // Verify request_log entries were created in database
    const requestLogRepo = AppDataSource.getRepository(RequestLog);
    const logs = await requestLogRepo.findBy({ username: testUser });
    expect(logs).toHaveLength(2);
    expect(logs[0].card_type).toBe('views');
    expect(logs[0].source).toBe('github');

    // Call with increment: false, should retrieve the current value (2) without modifying it
    const currentViews = await metricsRepo.getOrIncrementProfileViews(testUser, false, hitContext);
    expect(currentViews).toBe(2);
  });

  it('should render views badge SVG correctly with custom label and color overrides', () => {
    // 1. Render flat style with custom color
    const svgCustomColor = renderViewsBadge(42, 'Visitas', 'red', undefined, 'flat');
    expect(svgCustomColor).toContain('<svg');
    expect(svgCustomColor).toContain('Visitas');
    expect(svgCustomColor).toContain('42');
    expect(svgCustomColor).toContain('fill="#e05d44"'); // mapped 'red' hex color
    expect(svgCustomColor).toContain('rx="3"'); // flat style rounded corners

    // 2. Render flat-square style with theme colors (neon theme)
    const svgNeonTheme = renderViewsBadge(105, 'Views', undefined, 'neon', 'flat-square');
    expect(svgNeonTheme).toContain('Views');
    expect(svgNeonTheme).toContain('105');
    expect(svgNeonTheme).toContain('fill="#00ff66"'); // neon theme accent color
    expect(svgNeonTheme).toContain('rx="0"'); // flat-square style sharp corners
  });
});
