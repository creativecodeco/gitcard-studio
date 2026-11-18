import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { UserStats } from '@/domain/entities/UserStats';
import { LanguageStat } from '@/domain/entities/LanguageStat';
import { RepoStats } from '@/domain/entities/RepoStats';
import { StreakStats } from '@/domain/entities/StreakStats';
import { SponsorStats } from '@/domain/entities/SponsorStats';
import { CacheStore, RedisCacheAdapter } from '@/infrastructure/cache/RedisCacheAdapter';

export class CachedGitHubRepository implements IGitHubRepository {
  private readonly CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours in seconds
  private readonly inFlightRequests = new Map<string, Promise<unknown>>();

  constructor(
    private readonly delegate: IGitHubRepository,
    private readonly cacheStore: CacheStore = new RedisCacheAdapter()
  ) {}

  private async getOrFetch<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    cacheNull: boolean = true
  ): Promise<T> {
    const cached = await this.cacheStore.get<T>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const existingPromise = this.inFlightRequests.get(cacheKey) as Promise<T> | undefined;
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async (): Promise<T> => {
      const data = await fetcher();
      if (cacheNull || (data !== null && data !== undefined)) {
        await this.cacheStore.set(cacheKey, data, this.CACHE_TTL_SECONDS);
      }
      return data;
    })().finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });

    this.inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async getUserStats(username: string, userToken?: string): Promise<UserStats> {
    const cacheKey = `stats:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    return this.getOrFetch(cacheKey, () => this.delegate.getUserStats(username, userToken));
  }

  async getUserLanguages(username: string, userToken?: string): Promise<LanguageStat[]> {
    const cacheKey = `langs:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    return this.getOrFetch(cacheKey, () => this.delegate.getUserLanguages(username, userToken));
  }

  async getFeaturedRepo(
    username: string,
    repoName?: string,
    userToken?: string
  ): Promise<RepoStats> {
    const cacheKey = `repo:${username.toLowerCase()}:${(repoName || '').toLowerCase()}:${userToken ? 'private' : 'public'}`;
    return this.getOrFetch(cacheKey, () =>
      this.delegate.getFeaturedRepo(username, repoName, userToken)
    );
  }

  async getUserTopRepos(
    username: string,
    limit: number = 4,
    userToken?: string
  ): Promise<RepoStats[]> {
    const cacheKey = `toprepos:${username.toLowerCase()}:${limit}:${userToken ? 'private' : 'public'}`;
    return this.getOrFetch(cacheKey, () =>
      this.delegate.getUserTopRepos(username, limit, userToken)
    );
  }

  async getUserStreak(username: string, userToken?: string): Promise<StreakStats> {
    const cacheKey = `streak:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    return this.getOrFetch(cacheKey, () => this.delegate.getUserStreak(username, userToken));
  }

  async getUserSponsors(username: string, userToken?: string): Promise<SponsorStats> {
    const cacheKey = `sponsors:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    return this.getOrFetch(cacheKey, () => this.delegate.getUserSponsors(username, userToken));
  }

  async getUserCommitActivity(
    username: string,
    userToken?: string
  ): Promise<{
    username: string;
    totalCommitsThisYear: number;
    commitsToday: number;
    hourlyMatrix: number[][];
  }> {
    const cacheKey = `activity:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    return this.getOrFetch(cacheKey, () =>
      this.delegate.getUserCommitActivity(username, userToken)
    );
  }

  async getProfileReadme(username: string): Promise<string | null> {
    const cacheKey = `readme:${username.toLowerCase()}`;
    return this.getOrFetch(cacheKey, () => this.delegate.getProfileReadme(username), false);
  }

  async isReadmeCached(username: string): Promise<boolean> {
    const cacheKey = `readme:${username.toLowerCase()}`;
    const cached = await this.cacheStore.get<string | null>(cacheKey);
    return cached !== null && cached !== undefined;
  }

  async clearCache(username: string): Promise<void> {
    const keyBase = username.toLowerCase();
    await this.cacheStore.flushPattern(keyBase);
    await this.cacheStore.del(`readme:${keyBase}`);
    await this.delegate.clearCache(username);
  }
}
