import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterOAuthTokenUseCase } from '@/use-cases/tokens/RegisterOAuthTokenUseCase';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';

describe('RegisterOAuthTokenUseCase', () => {
  let mockTokenRepo: ITokenRepository;
  let mockGitHubRepo: IGitHubRepository;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    mockTokenRepo = {
      saveToken: vi.fn().mockResolvedValue(undefined),
      getToken: vi.fn().mockResolvedValue(null),
      deleteToken: vi.fn().mockResolvedValue(undefined)
    };

    mockGitHubRepo = {
      getStats: vi.fn(),
      getLanguages: vi.fn(),
      getTopRepos: vi.fn(),
      getFeaturedRepo: vi.fn(),
      getStreakStats: vi.fn(),
      getSponsorStats: vi.fn(),
      clearCache: vi.fn()
    } as unknown as IGitHubRepository;
  });

  it('should register an OAuth / GitHub App token and clear user cache', async () => {
    const useCase = new RegisterOAuthTokenUseCase(mockTokenRepo, mockGitHubRepo);

    const result = await useCase.execute({
      username: 'octocat',
      accessToken: 'ghu_testAccessToken123',
      refreshToken: 'ghr_testRefreshToken123',
      expiresIn: 28800,
      scope: 'read:user',
      tokenType: 'app_user',
      ip: '127.0.0.1',
      userAgent: 'VitestTest'
    });

    expect(result.username).toBe('octocat');
    expect(result.message).toContain('vinculada exitosamente');
    expect(mockTokenRepo.saveToken).toHaveBeenCalledTimes(1);
    expect(mockGitHubRepo.clearCache).toHaveBeenCalledWith('octocat');
  });
});

describe('AuthController disconnectAccount', () => {
  let mockTokenRepo: ITokenRepository;
  let mockGitHubRepo: IGitHubRepository;
  let authController: any;

  beforeEach(async () => {
    mockTokenRepo = {
      saveToken: vi.fn().mockResolvedValue(undefined),
      getToken: vi.fn().mockResolvedValue(null),
      deleteToken: vi.fn().mockResolvedValue(undefined)
    };

    mockGitHubRepo = {
      getStats: vi.fn(),
      getLanguages: vi.fn(),
      getTopRepos: vi.fn(),
      getFeaturedRepo: vi.fn(),
      getStreakStats: vi.fn(),
      getSponsorStats: vi.fn(),
      clearCache: vi.fn()
    } as unknown as IGitHubRepository;

    const { AuthController } = await import('@/modules/auth/auth.controller');
    authController = new AuthController({} as any, {} as any, mockTokenRepo, mockGitHubRepo);
  });

  it('should disconnect successfully when token is app_user without requiring raw token', async () => {
    (mockTokenRepo.getToken as any).mockResolvedValue({
      token: 'ghu_secret',
      token_type: 'app_user',
      username: 'octocat'
    });

    const res = await authController.disconnectAccount({ username: 'octocat' });
    expect(res.message).toBeDefined();
    expect(mockTokenRepo.deleteToken).toHaveBeenCalledWith('octocat');
    expect(mockGitHubRepo.clearCache).toHaveBeenCalledWith('octocat');
  });

  it('should return success if no token exists in repository', async () => {
    (mockTokenRepo.getToken as any).mockResolvedValue(null);

    const res = await authController.disconnectAccount({ username: 'nonexistent' });
    expect(res.message).toBeDefined();
    expect(mockTokenRepo.deleteToken).not.toHaveBeenCalled();
  });
});
