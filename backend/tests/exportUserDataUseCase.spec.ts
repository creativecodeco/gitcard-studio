import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportUserDataUseCase } from '@/use-cases/users/ExportUserDataUseCase';
import { AppDataSource } from '@/infrastructure/database/database';

vi.mock('@/infrastructure/database/database', () => {
  return {
    AppDataSource: {
      getRepository: vi.fn()
    }
  };
});

describe('ExportUserDataUseCase', () => {
  let useCase: ExportUserDataUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ExportUserDataUseCase();
  });

  it('should export formatted user data', async () => {
    const mockTokenRepo = {
      findOne: vi.fn().mockResolvedValue({
        username: 'testuser',
        token_type: 'pat',
        scopes: 'read:user',
        consent_accepted: true,
        consent_date: '2026-08-20T10:00:00Z',
        consent_fingerprint: 'fp-12345',
        updated_at: '2026-08-20T10:00:00Z'
      })
    };

    const mockMetricRepo = {
      findOne: vi.fn().mockResolvedValue({
        username: 'testuser',
        profile_views: 42,
        stats_web: 10,
        stats_github: 5
      })
    };

    const mockHistoryRepo = {
      find: vi.fn().mockResolvedValue([
        {
          recorded_at: '2026-08-20T10:00:00Z',
          stars: 10,
          commits: 50,
          prs: 5,
          issues: 1,
          followers: 12,
          languages: { TypeScript: 100 }
        }
      ])
    };

    const mockLogRepo = {
      find: vi
        .fn()
        .mockResolvedValue([
          { card_type: 'stats', source: 'github', created_at: '2026-08-20T10:00:00Z' }
        ])
    };

    vi.mocked(AppDataSource.getRepository).mockImplementation((entity: unknown) => {
      const name = (entity as { name?: string }).name;
      if (name === 'UserTokenEntity') return mockTokenRepo as never;
      if (name === 'UserMetric') return mockMetricRepo as never;
      if (name === 'UserStatsHistory') return mockHistoryRepo as never;
      if (name === 'RequestLog') return mockLogRepo as never;
      return {} as never;
    });

    const result = await useCase.execute('testuser');

    expect(result.username).toBe('testuser');
    expect(result.consentRecord.hasRegisteredToken).toBe(true);
    expect(result.consentRecord.consentFingerprint).toBe('fp-12345');
    expect(result.metrics?.profile_views).toBe(42);
    expect(result.statsHistory).toHaveLength(1);
    expect(result.recentActivityLogs).toHaveLength(1);
  });

  it('should utilize constructor-injected repositories directly when provided', async () => {
    const customTokenRepo = {
      findOne: vi.fn().mockResolvedValue({
        username: 'injected_user',
        token_type: 'oauth',
        scopes: 'read:org',
        consent_accepted: true,
        consent_date: '2026-09-01T12:00:00Z',
        consent_fingerprint: 'fp-injected',
        updated_at: '2026-09-01T12:00:00Z'
      })
    };
    const customMetricRepo = {
      findOne: vi.fn().mockResolvedValue({
        username: 'injected_user',
        profile_views: 99
      })
    };
    const customHistoryRepo = { find: vi.fn().mockResolvedValue([]) };
    const customLogRepo = { find: vi.fn().mockResolvedValue([]) };

    const injectedUseCase = new ExportUserDataUseCase(
      customTokenRepo as never,
      customMetricRepo as never,
      customHistoryRepo as never,
      customLogRepo as never
    );

    const result = await injectedUseCase.execute('injected_user');

    expect(result.username).toBe('injected_user');
    expect(result.consentRecord.tokenType).toBe('oauth');
    expect(result.metrics?.profile_views).toBe(99);
    expect(customTokenRepo.findOne).toHaveBeenCalledWith({ where: { username: 'injected_user' } });
    expect(customMetricRepo.findOne).toHaveBeenCalledWith({ where: { username: 'injected_user' } });
  });
});
