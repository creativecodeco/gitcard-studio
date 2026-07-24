import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { validateUsername } from '@/domain/entities/Validation';
import { HitContext } from '@/domain/entities/Metrics';

export class RecordProfileViewUseCase {
  constructor(private readonly metricsRepo: IMetricsRepository) {}

  async execute(
    username: string,
    userAgent?: string,
    referer?: string,
    isPreview?: boolean,
    hitContext?: HitContext
  ): Promise<number> {
    validateUsername(username);

    // If request is explicitly a preview (e.g. from web app UI), do not increment count
    const shouldIncrement = !isPreview;

    const context: HitContext = hitContext ?? {
      username,
      userAgent,
      referer
    };

    return this.metricsRepo.getOrIncrementProfileViews(username, shouldIncrement, context);
  }
}
