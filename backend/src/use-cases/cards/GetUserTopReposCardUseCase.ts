import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { HitContext } from '@/domain/entities/Metrics';
import { getDecryptedToken } from '@/infrastructure/security/security';
import { renderTopReposCard } from '@/adapters/presenters/topReposCard';

export class GetUserTopReposCardUseCase {
  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly tokenRepo?: ITokenRepository,
    private readonly metricsRepo?: IMetricsRepository
  ) {}

  async execute(
    username: string,
    theme: string,
    overrides: Record<string, string>,
    hitContext?: HitContext
  ): Promise<string> {
    if (this.metricsRepo) {
      this.metricsRepo.recordHit('repo', hitContext);
    }
    const userToken = this.tokenRepo ? await getDecryptedToken(username, this.tokenRepo) : undefined;
    const repos = await this.githubRepo.getUserTopRepos(username, 4, userToken);
    return renderTopReposCard(repos, theme, overrides);
  }
}
