import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';
import { VerifyUserReadmeUseCase } from '@/use-cases/metrics/VerifyUserReadmeUseCase';
import { ApiGitHubRepository } from '@/adapters/repositories/ApiGitHubRepository';
import { CachedGitHubRepository } from '@/adapters/repositories/CachedGitHubRepository';

@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: 'IMetricsRepository',
      useClass: TypeORMMetricsRepository
    },
    {
      provide: 'IGitHubRepository',
      useFactory: () => new CachedGitHubRepository(new ApiGitHubRepository())
    },
    {
      provide: VerifyUserReadmeUseCase,
      useFactory: (gh, metrics) => new VerifyUserReadmeUseCase(gh, metrics),
      inject: ['IGitHubRepository', 'IMetricsRepository']
    }
  ],
  exports: ['IMetricsRepository', VerifyUserReadmeUseCase]
})
export class MetricsModule {}
