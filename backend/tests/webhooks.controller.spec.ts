import { describe, it, expect } from 'vitest';
import { WebhooksController } from '@/modules/webhooks/webhooks.controller';

describe('WebhooksController', () => {
  const controller = new WebhooksController();

  it('should handle push webhook event and invalidate cache for sender', async () => {
    const payload = {
      sender: { login: 'octocat' },
      repository: { name: 'gitcard-studio' }
    };

    const res = await controller.handleGitHubWebhook(payload, 'push', undefined);
    expect(res.invalidated).toBe(true);
    expect(res.message).toContain('octocat');
  });

  it('should return invalidated=false for non-push events', async () => {
    const payload = { action: 'created' };
    const res = await controller.handleGitHubWebhook(payload, 'star', undefined);
    expect(res.invalidated).toBe(false);
  });
});
