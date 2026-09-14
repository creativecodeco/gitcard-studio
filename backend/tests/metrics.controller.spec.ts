import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common';
import { MetricsController } from '../src/modules/metrics/metrics.controller';
import { IMetricsRepository } from '../src/domain/repositories/IMetricsRepository';
import { MetricsHistoryQueryDto, MetricsKeyQueryDto } from '../src/modules/metrics/dto/metrics.dto';
import { VerifyUserReadmeUseCase } from '../src/use-cases/metrics/VerifyUserReadmeUseCase';

const VALID_KEY = 'test-metrics-key-123';

describe('MetricsController', () => {
  let controller: MetricsController;

  const mockMetricsRepo: IMetricsRepository = {
    recordHit: vi.fn(),
    getMetrics: vi.fn().mockResolvedValue({ totalRenders: 42 }),
    getUserMetrics: vi.fn(),
    getAllUserMetrics: vi.fn().mockResolvedValue([]),
    getUniqueUsersCount: vi.fn().mockResolvedValue(5),
    getOrIncrementProfileViews: vi.fn(),
    getRendersHistory: vi.fn().mockResolvedValue([{ date: '2026-07-24', count: 10 }]),
    updateUserReadmeVerification: vi.fn()
  };

  const mockVerifyUserReadmeUseCase = {
    execute: vi.fn().mockResolvedValue({
      username: 'testuser',
      hasProfileReadme: true,
      isUsingGitCard: true,
      detectedCards: ['views', 'stats'],
      verifiedAt: new Date(),
      cacheRefreshed: true,
      cacheValidated: true
    }),
    executeBatch: vi.fn().mockResolvedValue({
      totalAudited: 2,
      verifiedCount: 1,
      cacheUpdated: true,
      cacheValidated: true,
      results: [
        {
          username: 'testuser',
          hasProfileReadme: true,
          isUsingGitCard: true,
          detectedCards: ['views', 'stats'],
          verifiedAt: new Date(),
          cacheRefreshed: true,
          cacheValidated: true
        }
      ]
    })
  };

  beforeEach(async () => {
    process.env.METRICS_KEY = VALID_KEY;
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        { provide: 'IMetricsRepository', useValue: mockMetricsRepo },
        { provide: VerifyUserReadmeUseCase, useValue: mockVerifyUserReadmeUseCase }
      ]
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  describe('validateMetricsKey (via getMetrics)', () => {
    it('should throw ForbiddenException when METRICS_KEY env is not set', async () => {
      delete process.env.METRICS_KEY;
      const query: MetricsKeyQueryDto = { key: 'any-key' };

      await expect(controller.getMetrics(query)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException when key is missing', async () => {
      const query: MetricsKeyQueryDto = {};

      await expect(controller.getMetrics(query)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when key is incorrect', async () => {
      const query: MetricsKeyQueryDto = { key: 'wrong-key' };

      await expect(controller.getMetrics(query)).rejects.toThrow(UnauthorizedException);
    });

    it('should accept key from x-api-key header', async () => {
      const query: MetricsKeyQueryDto = {};

      const result = await controller.getMetrics(query, VALID_KEY);

      expect(result).toEqual({ totalRenders: 42 });
    });

    it('should accept key from query parameter', async () => {
      const query: MetricsKeyQueryDto = { key: VALID_KEY };

      const result = await controller.getMetrics(query);

      expect(result).toEqual({ totalRenders: 42 });
    });

    it('should prefer x-api-key header over query key', async () => {
      const query: MetricsKeyQueryDto = { key: 'wrong-key' };

      // Header has priority — wrong query key should be ignored
      const result = await controller.getMetrics(query, VALID_KEY);
      expect(result).toEqual({ totalRenders: 42 });
    });
  });

  describe('getRendersHistory()', () => {
    it('should return history data with valid key and default days', async () => {
      const query: MetricsHistoryQueryDto = { key: VALID_KEY };

      const result = await controller.getRendersHistory(query);

      expect(mockMetricsRepo.getRendersHistory).toHaveBeenCalledWith(7);
      expect(result).toEqual([{ date: '2026-07-24', count: 10 }]);
    });

    it('should pass custom days to repository', async () => {
      const query: MetricsHistoryQueryDto = { key: VALID_KEY, days: 30 };

      await controller.getRendersHistory(query);

      expect(mockMetricsRepo.getRendersHistory).toHaveBeenCalledWith(30);
    });

    it('should throw InternalServerErrorException when repository throws', async () => {
      const query: MetricsHistoryQueryDto = { key: VALID_KEY };
      vi.mocked(mockMetricsRepo.getRendersHistory).mockRejectedValue(new Error('DB error'));

      await expect(controller.getRendersHistory(query)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('getUserMetrics()', () => {
    it('should return user metrics with valid key', async () => {
      const query: MetricsKeyQueryDto = { key: VALID_KEY };
      vi.mocked(mockMetricsRepo.getAllUserMetrics).mockResolvedValue([{ username: 'testuser' }]);

      const result = await controller.getUserMetrics(query);

      expect(result).toEqual([{ username: 'testuser' }]);
    });
  });

  describe('getUniqueUsersCount()', () => {
    it('should return user count without authentication', async () => {
      const result = await controller.getUniqueUsersCount();

      expect(result).toBe(5);
    });

    it('should throw InternalServerErrorException when repository throws', async () => {
      vi.mocked(mockMetricsRepo.getUniqueUsersCount).mockRejectedValue(new Error('DB error'));

      await expect(controller.getUniqueUsersCount()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getConfig()', () => {
    it('should return privateStatsComingSoon as false', () => {
      const result = controller.getConfig();
      expect(result.privateStatsComingSoon).toBe(false);
    });
  });

  describe('verifyUserReadme()', () => {
    it('should verify readme with valid key and return result', async () => {
      const result = await controller.verifyUserReadme({
        username: 'testuser',
        key: VALID_KEY
      });

      expect(mockVerifyUserReadmeUseCase.execute).toHaveBeenCalledWith('testuser', true);
      expect(result).toMatchObject({
        username: 'testuser',
        hasProfileReadme: true,
        isUsingGitCard: true,
        detectedCards: ['views', 'stats']
      });
    });

    it('should pass custom forceRefresh parameter to use case', async () => {
      await controller.verifyUserReadme({
        username: 'testuser',
        forceRefresh: false,
        key: VALID_KEY
      });

      expect(mockVerifyUserReadmeUseCase.execute).toHaveBeenCalledWith('testuser', false);
    });

    it('should throw UnauthorizedException when key is missing or invalid', async () => {
      await expect(
        controller.verifyUserReadme({
          username: 'testuser',
          key: 'wrong-key'
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyReadmesBatch()', () => {
    it('should audit batch with valid key and return aggregated results', async () => {
      const result = await controller.verifyReadmesBatch({
        usernames: ['testuser'],
        forceRefresh: true,
        key: VALID_KEY
      });

      expect(mockVerifyUserReadmeUseCase.executeBatch).toHaveBeenCalledWith({
        usernames: ['testuser'],
        limit: undefined,
        forceRefresh: true
      });
      expect(result).toMatchObject({
        totalAudited: 2,
        verifiedCount: 1,
        cacheUpdated: true,
        cacheValidated: true
      });
    });

    it('should throw UnauthorizedException when key is missing or invalid', async () => {
      await expect(
        controller.verifyReadmesBatch({
          key: 'invalid-key'
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when METRICS_KEY is not configured', async () => {
      delete process.env.METRICS_KEY;

      await expect(
        controller.verifyReadmesBatch({
          key: VALID_KEY
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
