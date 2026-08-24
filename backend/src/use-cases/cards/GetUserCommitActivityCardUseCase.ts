import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { getDecryptedToken } from '@/infrastructure/security/security';
import { renderCommitActivityCard } from '@/adapters/presenters/commitActivityCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

export class GetUserCommitActivityCardUseCase {
  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly metricsRepo: IMetricsRepository,
    private readonly tokenRepo?: ITokenRepository
  ) {}

  async execute(
    username: string,
    theme: string,
    overrides: Record<string, string>,
    cardWidth?: string,
    hitContext?: HitContext
  ): Promise<string> {
    validateUsername(username);

    const userToken = this.tokenRepo
      ? await getDecryptedToken(username, this.tokenRepo)
      : undefined;
    const activityData = await this.githubRepo.getUserCommitActivity(username, userToken);

    const svg = renderCommitActivityCard(activityData, {
      theme,
      cardWidth,
      locale: overrides.locale,
      overrides
    });

    this.metricsRepo.recordHit('commit-activity', hitContext);

    return svg;
  }
}
