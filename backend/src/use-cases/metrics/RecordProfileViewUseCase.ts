import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { validateUsername } from '@/domain/entities/Validation';

export class RecordProfileViewUseCase {
  constructor(private readonly metricsRepo: IMetricsRepository) {}

  async execute(
    username: string,
    _userAgent?: string,
    _referer?: string,
    isPreview?: boolean
  ): Promise<number> {
    validateUsername(username);

    // If request is explicitly a preview (e.g. from web app UI), do not increment count
    const shouldIncrement = !isPreview;

    return await this.metricsRepo.getOrIncrementProfileViews(username, shouldIncrement);
  }
}
