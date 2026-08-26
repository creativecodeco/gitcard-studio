import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { UserStats } from '@/domain/entities/UserStats';
import { LanguageStat } from '@/domain/entities/LanguageStat';
import { RepoStats } from '@/domain/entities/RepoStats';
import { StreakStats } from '@/domain/entities/StreakStats';
import { SponsorStats } from '@/domain/entities/SponsorStats';
import { CacheStore, RedisCacheAdapter } from '@/infrastructure/cache/RedisCacheAdapter';

export class CachedGitHubRepository implements IGitHubRepository {
  private readonly CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours in seconds

  constructor(
    private readonly delegate: IGitHubRepository,
    private readonly cacheStore: CacheStore = new RedisCacheAdapter()
  ) {}

  async getUserStats(username: string, userToken?: string): Promise<UserStats> {
    const cacheKey = `stats:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = await this.cacheStore.get<UserStats>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await this.delegate.getUserStats(username, userToken);
    await this.cacheStore.set(cacheKey, data, this.CACHE_TTL_SECONDS);
    return data;
  }

  async getUserLanguages(username: string, userToken?: string): Promise<LanguageStat[]> {
    const cacheKey = `langs:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = await this.cacheStore.get<LanguageStat[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await this.delegate.getUserLanguages(username, userToken);
    await this.cacheStore.set(cacheKey, data, this.CACHE_TTL_SECONDS);
    return data;
  }

  async getFeaturedRepo(
    username: string,
    repoName?: string,
    userToken?: string
  ): Promise<RepoStats> {
    const cacheKey = `repo:${username.toLowerCase()}:${(repoName || '').toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = await this.cacheStore.get<RepoStats>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await this.delegate.getFeaturedRepo(username, repoName, userToken);
    await this.cacheStore.set(cacheKey, data, this.CACHE_TTL_SECONDS);
    return data;
  }

  async getUserTopRepos(
    username: string,
    limit: number = 4,
    userToken?: string
  ): Promise<RepoStats[]> {
    const cacheKey = `toprepos:${username.toLowerCase()}:${limit}:${userToken ? 'private' : 'public'}`;
    const cached = await this.cacheStore.get<RepoStats[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await this.delegate.getUserTopRepos(username, limit, userToken);
    await this.cacheStore.set(cacheKey, data, this.CACHE_TTL_SECONDS);
    return data;
  }

  async getUserStreak(username: string, userToken?: string): Promise<StreakStats> {
    const cacheKey = `streak:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = await this.cacheStore.get<StreakStats>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await this.delegate.getUserStreak(username, userToken);
    await this.cacheStore.set(cacheKey, data, this.CACHE_TTL_SECONDS);
    return data;
  }

  async getUserSponsors(username: string, userToken?: string): Promise<SponsorStats> {
    const cacheKey = `sponsors:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    const cached = await this.cacheStore.get<SponsorStats>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await this.delegate.getUserSponsors(username, userToken);
    await this.cacheStore.set(cacheKey, data, this.CACHE_TTL_SECONDS);
    return data;
  }

  async getUserCommitActivity(
    username: string,
    userToken?: string
  ): Promise<{ username: string; totalCommitsThisYear: number; hourlyMatrix: number[][] }> {
    const cacheKey = `activity:${username.toLowerCase()}:${userToken ? 'private' : 'public'}`;
    type ActivityData = {
      username: string;
      totalCommitsThisYear: number;
      hourlyMatrix: number[][];
    };
    const cached = await this.cacheStore.get<ActivityData>(cacheKey);

    if (cached) {
      return cached;
    }

    const data = await this.delegate.getUserCommitActivity(username, userToken);
    await this.cacheStore.set(cacheKey, data, this.CACHE_TTL_SECONDS);
    return data;
  }

  clearCache(username: string): void {
    const keyBase = username.toLowerCase();
    this.cacheStore.flushPattern(keyBase);
    this.delegate.clearCache(username);
  }
}
