import { describe, it, expect, afterEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { WebhooksController } from '@/modules/webhooks/webhooks.controller';

describe('WebhooksController', () => {
  const controller = new WebhooksController();

  afterEach(() => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
  });

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

  it('should reject invalid length HMAC signature with ForbiddenException instead of RangeError', async () => {
    const mockHookKey = 'mock-hook-key-123';
    process.env.GITHUB_WEBHOOK_SECRET = mockHookKey;
    const payload = { sender: { login: 'octocat' } };

    await expect(controller.handleGitHubWebhook(payload, 'push', 'sha256=short')).rejects.toThrow(
      ForbiddenException
    );
  });

  it('should ignore push events with invalid wildcard username to prevent full cache flush', async () => {
    const payload = {
      sender: { login: '*' }
    };

    const res = await controller.handleGitHubWebhook(payload, 'push', undefined);
    expect(res.invalidated).toBe(false);
  });

  it('should verify HMAC signature using rawBody when provided', async () => {
    const crypto = await import('node:crypto');
    const mockHookKey = 'mock-hook-key-456';
    process.env.GITHUB_WEBHOOK_SECRET = mockHookKey;
    const rawBody = '{"sender":{"login":"octocat"}}';
    const validSig = `sha256=${crypto.default
      .createHmac('sha256', mockHookKey)
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex')}`;

    const res = await controller.handleGitHubWebhook(
      { sender: { login: 'octocat' } },
      'push',
      validSig,
      { rawBody }
    );
    expect(res.invalidated).toBe(true);
  });
});
