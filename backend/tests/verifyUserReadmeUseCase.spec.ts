import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerifyUserReadmeUseCase } from '@/use-cases/metrics/VerifyUserReadmeUseCase';
import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';

describe('VerifyUserReadmeUseCase', () => {
  let useCase: VerifyUserReadmeUseCase;
  let mockGitHubRepo: IGitHubRepository;
  let mockMetricsRepo: IMetricsRepository;

  beforeEach(() => {
    mockGitHubRepo = {
      getUserStats: vi.fn(),
      getUserLanguages: vi.fn(),
      getFeaturedRepo: vi.fn(),
      getUserTopRepos: vi.fn(),
      getUserStreak: vi.fn(),
      getUserSponsors: vi.fn(),
      getUserCommitActivity: vi.fn(),
      getProfileReadme: vi.fn(),
      clearCache: vi.fn(),
      isReadmeCached: vi.fn().mockResolvedValue(true)
    };

    mockMetricsRepo = {
      recordHit: vi.fn(),
      getMetrics: vi.fn(),
      getUserMetrics: vi.fn(),
      getAllUserMetrics: vi.fn(),
      getUniqueUsersCount: vi.fn(),
      getOrIncrementProfileViews: vi.fn(),
      getRendersHistory: vi.fn(),
      updateUserReadmeVerification: vi.fn()
    };

    useCase = new VerifyUserReadmeUseCase(mockGitHubRepo, mockMetricsRepo);
  });

  it('should return false when user has no profile README', async () => {
    vi.mocked(mockGitHubRepo.getProfileReadme).mockResolvedValue(null);
    if (mockGitHubRepo.isReadmeCached) {
      vi.mocked(mockGitHubRepo.isReadmeCached).mockResolvedValue(false);
    }

    const result = await useCase.execute('octocat');

    expect(result.hasProfileReadme).toBe(false);
    expect(result.isUsingGitCard).toBe(false);
    expect(result.detectedCards).toEqual([]);
    expect(result.cacheRefreshed).toBe(true);
    expect(result.cacheValidated).toBe(true);
    expect(mockMetricsRepo.updateUserReadmeVerification).toHaveBeenCalledWith('octocat', false, []);
  });

  it('should detect GitCard Studio when cards are embedded in the README', async () => {
    const sampleReadme = `
      # Hi, I am Octocat!
      ![GitHub Stats](https://gitcard-studio.creativecode.com.co/api/stats?username=octocat&theme=dark)
      ![Streak](https://gitcard-studio.creativecode.com.co/api/streak?username=octocat&theme=dark)
      ![Profile views](https://gitcard-studio.creativecode.com.co/api/views?username=octocat)
    `;
    vi.mocked(mockGitHubRepo.getProfileReadme).mockResolvedValue(sampleReadme);

    const result = await useCase.execute('octocat');

    expect(result.hasProfileReadme).toBe(true);
    expect(result.isUsingGitCard).toBe(true);
    expect(result.detectedCards).toContain('stats');
    expect(result.detectedCards).toContain('streak');
    expect(result.detectedCards).toContain('views');
    expect(result.cacheRefreshed).toBe(true);
    expect(result.cacheValidated).toBe(true);
    expect(mockMetricsRepo.updateUserReadmeVerification).toHaveBeenCalledWith('octocat', true, [
      'stats',
      'streak',
      'views'
    ]);
  });

  it('should clear cache before fetching when forceRefresh is true', async () => {
    vi.mocked(mockGitHubRepo.getProfileReadme).mockResolvedValue(null);

    await useCase.execute('octocat', true);

    expect(mockGitHubRepo.clearCache).toHaveBeenCalledWith('octocat');
    expect(mockGitHubRepo.getProfileReadme).toHaveBeenCalledWith('octocat');
  });

  it('should not clear cache when forceRefresh is false', async () => {
    vi.mocked(mockGitHubRepo.getProfileReadme).mockResolvedValue(null);

    await useCase.execute('octocat', false);

    expect(mockGitHubRepo.clearCache).not.toHaveBeenCalled();
    expect(mockGitHubRepo.getProfileReadme).toHaveBeenCalledWith('octocat');
  });

  it('should detect brand mention even if no specific card endpoints matched', async () => {
    const sampleReadme = `
      # My Profile
      Generated with [GitCard Studio](https://gitcard-studio.creativecode.com.co)
    `;
    vi.mocked(mockGitHubRepo.getProfileReadme).mockResolvedValue(sampleReadme);

    const result = await useCase.execute('octocat');

    expect(result.hasProfileReadme).toBe(true);
    expect(result.isUsingGitCard).toBe(true);
    expect(mockMetricsRepo.updateUserReadmeVerification).toHaveBeenCalledWith('octocat', true, []);
  });

  it('should return false when README exists but has no GitCard Studio cards', async () => {
    const sampleReadme = `
      # Hello World!
      This is my personal GitHub profile without any external cards.
    `;
    vi.mocked(mockGitHubRepo.getProfileReadme).mockResolvedValue(sampleReadme);

    const result = await useCase.execute('octocat');

    expect(result.hasProfileReadme).toBe(true);
    expect(result.isUsingGitCard).toBe(false);
    expect(result.detectedCards).toEqual([]);
    expect(mockMetricsRepo.updateUserReadmeVerification).toHaveBeenCalledWith('octocat', false, []);
  });

  it('should reject invalid usernames gracefully without querying GitHub', async () => {
    const result = await useCase.execute('invalid--username$$');

    expect(result.hasProfileReadme).toBe(false);
    expect(result.isUsingGitCard).toBe(false);
    expect(result.cacheRefreshed).toBe(false);
    expect(mockGitHubRepo.getProfileReadme).not.toHaveBeenCalled();
  });

  describe('executeBatch()', () => {
    it('should audit explicit list of usernames and return aggregated results', async () => {
      vi.mocked(mockGitHubRepo.getProfileReadme).mockImplementation(async (u) => {
        if (u === 'user1') {
          return 'Generated with GitCard Studio';
        }
        return 'Standard readme without cards';
      });

      const batchResult = await useCase.executeBatch({
        usernames: ['user1', 'user2']
      });

      expect(batchResult.totalAudited).toBe(2);
      expect(batchResult.verifiedCount).toBe(1);
      expect(batchResult.cacheUpdated).toBe(true);
      expect(batchResult.cacheValidated).toBe(true);
      expect(batchResult.results).toHaveLength(2);
      expect(mockGitHubRepo.clearCache).toHaveBeenCalledWith('user1');
      expect(mockGitHubRepo.clearCache).toHaveBeenCalledWith('user2');
    });

    it('should fetch all users from metricsRepo when no usernames provided', async () => {
      vi.mocked(mockMetricsRepo.getAllUserMetrics).mockResolvedValue([
        { username: 'alice' },
        { username: 'bob' }
      ]);
      vi.mocked(mockGitHubRepo.getProfileReadme).mockResolvedValue(
        '![Stats](/api/stats?username=x)'
      );

      const batchResult = await useCase.executeBatch();

      expect(mockMetricsRepo.getAllUserMetrics).toHaveBeenCalled();
      expect(batchResult.totalAudited).toBe(2);
      expect(batchResult.verifiedCount).toBe(2);
    });

    it('should respect the limit option in executeBatch', async () => {
      vi.mocked(mockMetricsRepo.getAllUserMetrics).mockResolvedValue([
        { username: 'user1' },
        { username: 'user2' },
        { username: 'user3' }
      ]);
      vi.mocked(mockGitHubRepo.getProfileReadme).mockResolvedValue(null);

      const batchResult = await useCase.executeBatch({ limit: 2 });

      expect(batchResult.totalAudited).toBe(2);
      expect(batchResult.results).toHaveLength(2);
    });
  });
});
