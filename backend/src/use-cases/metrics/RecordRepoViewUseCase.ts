import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { validateUsername, validateRepo } from '@/domain/entities/Validation';
import { HitContext } from '@/domain/entities/Metrics';

export class RecordRepoViewUseCase {
  constructor(private readonly metricsRepo: IMetricsRepository) {}

  async execute(
    username: string,
    repo: string,
    userAgent?: string,
    referer?: string,
    isPreview?: boolean,
    hitContext?: HitContext
  ): Promise<number> {
    validateUsername(username);
    validateRepo(repo);

    if (!this.metricsRepo.getOrIncrementRepoViews) {
      return 0;
    }

    const shouldIncrement = !isPreview;
    const normalizedRepo = repo.includes('/') ? repo.split('/').pop()! : repo;
    const context: HitContext = hitContext ?? {
      username,
      userAgent,
      referer
    };

    return this.metricsRepo.getOrIncrementRepoViews(
      username,
      normalizedRepo,
      shouldIncrement,
      context
    );
  }
}
