import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordProfileViewUseCase } from '@/use-cases/metrics/RecordProfileViewUseCase';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';

describe('RecordProfileViewUseCase', () => {
  let mockMetricsRepo: IMetricsRepository;
  let useCase: RecordProfileViewUseCase;

  beforeEach(() => {
    mockMetricsRepo = {
      recordHit: vi.fn(),
      getMetrics: vi.fn(),
      getUserMetrics: vi.fn(),
      getAllUserMetrics: vi.fn(),
      getUniqueUsersCount: vi.fn(),
      getOrIncrementProfileViews: vi.fn().mockResolvedValue(10),
      getRendersHistory: vi.fn(),
      loadGlobalMetricsCache: vi.fn(),
    };
    useCase = new RecordProfileViewUseCase(mockMetricsRepo);
  });

  it('should increment profile views when isPreview is false or undefined', async () => {
    const result = await useCase.execute('validuser', 'GitHub-Camo/1.0', undefined, false);
    expect(mockMetricsRepo.getOrIncrementProfileViews).toHaveBeenCalledWith('validuser', true);
    expect(result).toBe(10);
  });

  it('should not increment profile views when isPreview is true', async () => {
    const result = await useCase.execute('validuser', 'Mozilla/5.0', 'http://localhost:3000', true);
    expect(mockMetricsRepo.getOrIncrementProfileViews).toHaveBeenCalledWith('validuser', false);
    expect(result).toBe(10);
  });

  it('should throw error for invalid username', async () => {
    await expect(useCase.execute('invalid_user!', 'Mozilla/5.0')).rejects.toThrow();
  });
});
