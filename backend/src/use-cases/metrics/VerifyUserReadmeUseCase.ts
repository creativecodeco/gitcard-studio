import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { GITHUB_USERNAME_REGEX } from '@/domain/entities/Validation';

export interface ReadmeVerificationResult {
  username: string;
  hasProfileReadme: boolean;
  isUsingGitCard: boolean;
  detectedCards: string[];
  readmeUrl?: string;
  verifiedAt: Date;
  cacheRefreshed: boolean;
  cacheValidated: boolean;
}

export interface VerifyBatchOptions {
  usernames?: string[];
  limit?: number;
  forceRefresh?: boolean;
}

export interface BatchVerificationResult {
  totalAudited: number;
  verifiedCount: number;
  cacheUpdated: boolean;
  cacheValidated: boolean;
  results: ReadmeVerificationResult[];
}

const CARD_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'stats', regex: /\/api\/stats(?:\?|["'\s)])/i },
  { name: 'languages', regex: /\/api\/languages(?:\?|["'\s)])/i },
  { name: 'repo', regex: /\/api\/repo(?:\?|["'\s)])/i },
  { name: 'rank', regex: /\/api\/rank(?:\?|["'\s)])/i },
  { name: 'streak', regex: /\/api\/streak(?:\?|["'\s)])/i },
  { name: 'trophies', regex: /\/api\/trophies(?:\?|["'\s)])/i },
  { name: 'views', regex: /\/api\/views(?:\?|["'\s)])/i },
  { name: 'sponsors', regex: /\/api\/sponsors(?:\?|["'\s)])/i },
  { name: 'commit-activity', regex: /\/api\/commit-activity(?:\?|["'\s)])/i },
  { name: 'today-status', regex: /\/api\/today-status(?:\?|["'\s)])/i },
  { name: 'timeline-matrix', regex: /\/api\/timeline-matrix(?:\?|["'\s)])/i },
  { name: 'top-repos', regex: /\/api\/top-repos(?:\?|["'\s)])/i }
];

export class VerifyUserReadmeUseCase {
  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly metricsRepo: IMetricsRepository
  ) {}

  async execute(username: string, forceRefresh: boolean = true): Promise<ReadmeVerificationResult> {
    const verifiedAt = new Date();

    if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
      return {
        username,
        hasProfileReadme: false,
        isUsingGitCard: false,
        detectedCards: [],
        verifiedAt,
        cacheRefreshed: false,
        cacheValidated: false
      };
    }

    const cleanUser = username.trim().toLowerCase();

    if (forceRefresh) {
      await this.githubRepo.clearCache(cleanUser);
    }

    const readmeContent = await this.githubRepo.getProfileReadme(cleanUser);

    let cacheValidated = true;
    if (this.githubRepo.isReadmeCached) {
      const isCached = await this.githubRepo.isReadmeCached(cleanUser);
      cacheValidated = readmeContent !== null ? isCached : !isCached;
    }

    if (!readmeContent) {
      await this.metricsRepo.updateUserReadmeVerification(cleanUser, false, []);
      return {
        username: cleanUser,
        hasProfileReadme: false,
        isUsingGitCard: false,
        detectedCards: [],
        verifiedAt,
        cacheRefreshed: Boolean(forceRefresh),
        cacheValidated
      };
    }

    const detectedCards: string[] = [];
    for (const card of CARD_PATTERNS) {
      if (card.regex.test(readmeContent)) {
        detectedCards.push(card.name);
      }
    }

    const hasBrandMention = /gitcard[-_\s]+studio/i.test(readmeContent);
    const isUsingGitCard = detectedCards.length > 0 || hasBrandMention;

    await this.metricsRepo.updateUserReadmeVerification(cleanUser, isUsingGitCard, detectedCards);

    return {
      username: cleanUser,
      hasProfileReadme: true,
      isUsingGitCard,
      detectedCards,
      readmeUrl: `https://github.com/${encodeURIComponent(cleanUser)}/${encodeURIComponent(cleanUser)}`,
      verifiedAt,
      cacheRefreshed: Boolean(forceRefresh),
      cacheValidated
    };
  }

  async executeBatch(options: VerifyBatchOptions = {}): Promise<BatchVerificationResult> {
    const forceRefresh = options.forceRefresh ?? true;
    const targetUsers =
      Array.isArray(options.usernames) && options.usernames.length > 0
        ? options.usernames
            .filter((u) => typeof u === 'string' && GITHUB_USERNAME_REGEX.test(u.trim()))
            .map((u) => u.trim().toLowerCase())
        : (await this.metricsRepo.getAllUserMetrics())
            .map((m: { username?: string }) => m.username)
            .filter(
              (u): u is string => typeof u === 'string' && GITHUB_USERNAME_REGEX.test(u.trim())
            )
            .map((u) => u.trim().toLowerCase());

    // Deduplicate usernames
    const uniqueUsers = Array.from(new Set(targetUsers));
    const finalUsers =
      typeof options.limit === 'number' && options.limit > 0
        ? uniqueUsers.slice(0, options.limit)
        : uniqueUsers;

    const concurrency = 4;
    const results: ReadmeVerificationResult[] = [];

    for (let i = 0; i < finalUsers.length; i += concurrency) {
      const chunk = finalUsers.slice(i, i + concurrency);
      const chunkResults = await Promise.all(chunk.map((user) => this.execute(user, forceRefresh)));
      results.push(...chunkResults);
    }

    const verifiedCount = results.filter((r) => r.isUsingGitCard).length;
    const allCacheValidated = results.every((r) => r.cacheValidated);

    return {
      totalAudited: results.length,
      verifiedCount,
      cacheUpdated: forceRefresh,
      cacheValidated: allCacheValidated,
      results
    };
  }
}
