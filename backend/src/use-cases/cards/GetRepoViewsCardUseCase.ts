import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { getDecryptedToken } from '@/infrastructure/security/security';
import { renderRepoViewsCard } from '@/adapters/presenters/repoViewsCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername, validateRepo, sanitizeBadgeLabel } from '@/domain/entities/Validation';

export class GetRepoViewsCardUseCase {
  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly tokenRepo: ITokenRepository,
    private readonly metricsRepo: IMetricsRepository
  ) {}

  async execute(
    username: string,
    repoName: string | undefined,
    theme: string,
    overrides: Record<string, string>,
    hitContext?: HitContext,
    customLabel?: unknown
  ): Promise<string> {
    validateUsername(username);
    if (repoName) {
      validateRepo(repoName);
    }

    const userToken = await getDecryptedToken(username, this.tokenRepo);
    const repoStats = await this.githubRepo.getFeaturedRepo(username, repoName, userToken);
    const rawTarget = repoStats.name || repoName || '';
    const targetRepo = rawTarget.includes('/') ? rawTarget.split('/').pop()! : rawTarget;

    const shouldIncrement = !hitContext?.isPreview;
    const viewsCount = this.metricsRepo.getOrIncrementRepoViews
      ? await this.metricsRepo.getOrIncrementRepoViews(
          username,
          targetRepo,
          shouldIncrement,
          hitContext
        )
      : 0;

    const cleanLabel =
      typeof customLabel === 'string' && customLabel.trim() !== ''
        ? sanitizeBadgeLabel(customLabel, '')
        : undefined;

    return renderRepoViewsCard(
      repoStats,
      viewsCount,
      theme,
      overrides,
      hitContext?.locale || 'es',
      cleanLabel
    );
  }
}
