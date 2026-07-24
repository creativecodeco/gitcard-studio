import 'reflect-metadata';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';
import { AppDataSource } from '@/infrastructure/database/database';
import { GlobalMetric } from '@/infrastructure/database/entities/GlobalMetric';

/**
 * Regression test for the "usage metrics counter is wrong" bug.
 *
 * In production the dashboard controller (MetricsModule) and the card-render
 * flow (CardsModule) are wired as SEPARATE provider instances of this
 * repository. Only the CardsModule instance ever receives recordHit(), and the
 * bootstrap-loaded instance in main.ts is discarded. The dashboard instance
 * therefore never sees any increments — so a global counter kept only in
 * per-instance memory always reads back as zero.
 *
 * getMetrics() MUST read the global_metrics table (the source of truth that
 * recordHit persists to), so that ANY instance — including a freshly created
 * dashboard instance — returns the real counts.
 */
describe('TypeORMMetricsRepository.getMetrics — reads DB source of truth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns global counters from the database, not a per-instance in-memory cache', async () => {
    const dbRows = [
      { metric_key: 'totalRenders', metric_value: 128 },
      { metric_key: 'statsRenders', metric_value: 50 },
      { metric_key: 'languagesRenders', metric_value: 20 },
      { metric_key: 'repoRenders', metric_value: 18 },
      { metric_key: 'rankRenders', metric_value: 10 },
      { metric_key: 'streakRenders', metric_value: 12 },
      { metric_key: 'trophiesRenders', metric_value: 8 },
      { metric_key: 'viewsRenders', metric_value: 10 }
    ];
    const fakeRepo = { find: vi.fn().mockResolvedValue(dbRows) };
    const getRepositorySpy = vi
      .spyOn(AppDataSource, 'getRepository')
      .mockReturnValue(fakeRepo as never);

    // A FRESH instance — exactly like the dashboard/MetricsModule singleton,
    // which never receives recordHit() and never preloads any cache.
    const dashboardRepo = new TypeORMMetricsRepository();

    const metrics = await dashboardRepo.getMetrics();

    expect(getRepositorySpy).toHaveBeenCalledWith(GlobalMetric);
    expect(fakeRepo.find).toHaveBeenCalled();
    expect(metrics.totalRenders).toBe(128);
    expect(metrics.statsRenders).toBe(50);
    expect(metrics.languagesRenders).toBe(20);
    expect(metrics.repoRenders).toBe(18);
    expect(metrics.rankRenders).toBe(10);
    expect(metrics.streakRenders).toBe(12);
    expect(metrics.trophiesRenders).toBe(8);
    expect(metrics.viewsRenders).toBe(10);
  });

  it('defaults every counter to 0 when a metric row is missing', async () => {
    const fakeRepo = {
      find: vi.fn().mockResolvedValue([{ metric_key: 'totalRenders', metric_value: 7 }])
    };
    vi.spyOn(AppDataSource, 'getRepository').mockReturnValue(fakeRepo as never);

    const repo = new TypeORMMetricsRepository();
    const metrics = await repo.getMetrics();

    expect(metrics.totalRenders).toBe(7);
    expect(metrics.statsRenders).toBe(0);
    expect(metrics.viewsRenders).toBe(0);
  });
});
