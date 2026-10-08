import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { renderTechStackCard } from '@/adapters/presenters/techStackCard';
import { HitContext } from '@/domain/entities/Metrics';
import { validateUsername } from '@/domain/entities/Validation';

export class GetTechStackCardUseCase {
  constructor(private readonly metricsRepo: IMetricsRepository) {}

  async execute(
    username: string,
    theme: string,
    overrides: Record<string, string>,
    hitContext?: HitContext
  ): Promise<string> {
    validateUsername(username);

    // Extract stack list from overrides.stack or query string
    const rawStack = overrides.stack || overrides.tech || '';
    const stackList = rawStack
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const svg = renderTechStackCard(username, stackList, theme, overrides);

    this.metricsRepo.recordHit('tech-stack', hitContext);

    return svg;
  }
}
