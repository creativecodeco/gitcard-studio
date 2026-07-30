import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TypeORMTokenRepository } from '@/adapters/repositories/TypeORMTokenRepository';
import { ApiGitHubRepository } from '@/adapters/repositories/ApiGitHubRepository';
import { RegisterOAuthTokenUseCase } from '@/use-cases/tokens/RegisterOAuthTokenUseCase';
import { PurgeUserDataUseCase } from '@/use-cases/users/PurgeUserDataUseCase';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: 'ITokenRepository',
      useClass: TypeORMTokenRepository,
    },
    {
      provide: 'IGitHubRepository',
      useClass: ApiGitHubRepository,
    },
    {
      provide: RegisterOAuthTokenUseCase,
      useFactory: (tokenRepo, ghRepo) => new RegisterOAuthTokenUseCase(tokenRepo, ghRepo),
      inject: ['ITokenRepository', 'IGitHubRepository'],
    },
    {
      provide: PurgeUserDataUseCase,
      useFactory: () => new PurgeUserDataUseCase(),
    },
  ],
})
export class AuthModule {}
