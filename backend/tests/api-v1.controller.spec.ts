import { describe, it, expect } from 'vitest';
import { ApiV1Controller } from '@/modules/api-v1/api-v1.controller';

describe('ApiV1Controller', () => {
  const mockStatsUseCase: any = {};
  const controller = new ApiV1Controller(mockStatsUseCase);

  it('should return JSON stats payload for valid username', async () => {
    const res = await controller.getUserStatsJson('octocat');
    expect(res.username).toBe('octocat');
    expect(res.format).toBe('json');
    expect(res.timestamp).toBeDefined();
  });

  it('should throw BadRequestException for invalid username', async () => {
    await expect(controller.getUserStatsJson('invalid_user_name_with_spaces!')).rejects.toThrow();
  });
});
