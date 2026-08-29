import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CardsController } from '@/modules/cards/cards.controller';
import { FastifyReply } from 'fastify';

describe('CardsController', () => {
  let controller: CardsController;
  let mockStatsUseCase: any;
  let mockLanguagesUseCase: any;
  let mockRepoUseCase: any;
  let mockRankUseCase: any;
  let mockStreakUseCase: any;
  let mockTrophiesUseCase: any;
  let mockRecordProfileViewUseCase: any;
  let mockTopReposUseCase: any;
  let mockSponsorsUseCase: any;
  let mockCommitActivityUseCase: any;
  let mockGithubRepo: any;
  let mockRes: Partial<FastifyReply>;

  beforeEach(() => {
    mockStatsUseCase = { execute: vi.fn().mockResolvedValue('<svg>stats</svg>') };
    mockLanguagesUseCase = { execute: vi.fn().mockResolvedValue('<svg>languages</svg>') };
    mockRepoUseCase = { execute: vi.fn().mockResolvedValue('<svg>repo</svg>') };
    mockRankUseCase = { execute: vi.fn().mockResolvedValue('<svg>rank</svg>') };
    mockStreakUseCase = { execute: vi.fn().mockResolvedValue('<svg>streak</svg>') };
    mockTrophiesUseCase = { execute: vi.fn().mockResolvedValue('<svg>trophies</svg>') };
    mockRecordProfileViewUseCase = { execute: vi.fn().mockResolvedValue(42) };
    mockTopReposUseCase = { execute: vi.fn().mockResolvedValue('<svg>top-repos</svg>') };
    mockSponsorsUseCase = { execute: vi.fn().mockResolvedValue('<svg>sponsors</svg>') };
    mockCommitActivityUseCase = {
      execute: vi.fn().mockResolvedValue('<svg>commit-activity</svg>')
    };
    mockGithubRepo = {
      clearCache: vi.fn(),
      getUserCommitActivity: vi.fn().mockResolvedValue({
        username: 'testuser',
        totalCommitsLastYear: 500,
        currentStreak: 10,
        longestStreak: 20,
        activeDaysLastYear: 100,
        commitCalendarWeeks: [],
        hourlyCommitMatrix: Array.from({ length: 7 }, () => Array(24).fill(0))
      })
    };

    const headers: Record<string, string> = {};
    mockRes = {
      header: vi.fn((key: string, val: string) => {
        headers[key] = val;
        return mockRes as FastifyReply;
      }),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    controller = new CardsController(
      mockStatsUseCase,
      mockLanguagesUseCase,
      mockRepoUseCase,
      mockRankUseCase,
      mockStreakUseCase,
      mockTrophiesUseCase,
      mockRecordProfileViewUseCase,
      mockTopReposUseCase,
      mockSponsorsUseCase,
      mockCommitActivityUseCase,
      mockGithubRepo
    );
  });

  it('should render stats card for valid username', async () => {
    const result = await controller.getStats(
      { username: 'octocat', theme: 'dark' },
      'User-Agent-Test',
      'https://github.com',
      '127.0.0.1',
      mockRes as FastifyReply
    );

    expect(mockRes.header).toHaveBeenCalledWith('Content-Type', 'image/svg+xml; charset=utf-8');
    expect(mockStatsUseCase.execute).toHaveBeenCalled();
    expect(result).toBe('<svg>stats</svg>');
  });

  it('should return error card when username is invalid', async () => {
    const result = await controller.getStats(
      { username: 'invalid_user_name!!' },
      undefined,
      undefined,
      '127.0.0.1',
      mockRes as FastifyReply
    );

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(result).toContain('Usuario de GitHub inválido');
  });

  it('should clear cache when cache=false parameter is passed', async () => {
    await controller.getStats(
      { username: 'octocat', cache: 'false' },
      undefined,
      undefined,
      '127.0.0.1',
      mockRes as FastifyReply
    );

    expect(mockGithubRepo.clearCache).toHaveBeenCalledWith('octocat');
  });

  it('should render languages card', async () => {
    const result = await controller.getLanguages(
      { username: 'octocat' },
      undefined,
      undefined,
      '127.0.0.1',
      mockRes as FastifyReply
    );

    expect(mockLanguagesUseCase.execute).toHaveBeenCalled();
    expect(result).toBe('<svg>languages</svg>');
  });

  it('should render streak card', async () => {
    const result = await controller.getStreak(
      { username: 'octocat' },
      undefined,
      undefined,
      '127.0.0.1',
      mockRes as FastifyReply
    );

    expect(mockStreakUseCase.execute).toHaveBeenCalled();
    expect(result).toBe('<svg>streak</svg>');
  });

  it('should render rank card', async () => {
    const result = await controller.getRank(
      { username: 'octocat' },
      undefined,
      undefined,
      '127.0.0.1',
      mockRes as FastifyReply
    );

    expect(mockRankUseCase.execute).toHaveBeenCalled();
    expect(result).toBe('<svg>rank</svg>');
  });

  it('should render profile views counter badge', async () => {
    const result = await controller.getProfileViews(
      { username: 'octocat', color: '38bdf8' },
      'User-Agent-Test',
      'https://github.com',
      '127.0.0.1',
      mockRes as FastifyReply
    );

    expect(mockRecordProfileViewUseCase.execute).toHaveBeenCalledWith(
      'octocat',
      'User-Agent-Test',
      'https://github.com',
      false,
      {
        username: 'octocat',
        userAgent: 'User-Agent-Test',
        referer: 'https://github.com',
        ip: '127.0.0.1'
      }
    );
    expect(result).toContain('svg');
  });
});
