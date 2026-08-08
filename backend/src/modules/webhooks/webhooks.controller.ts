import { Controller, Post, Body, Headers, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import crypto from 'node:crypto';
import { RedisCacheAdapter } from '@/infrastructure/cache/RedisCacheAdapter';
import { logger } from '@/infrastructure/logging/logger';

@Controller('api/webhooks')
export class WebhooksController {
  private readonly cacheAdapter = new RedisCacheAdapter();

  @Post('github')
  @HttpCode(HttpStatus.OK)
  async handleGitHubWebhook(
    @Body() body: any,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string | undefined
  ): Promise<{ message: string; invalidated: boolean }> {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    // If secret is set, verify HMAC signature
    if (webhookSecret) {
      if (!signature) {
        throw new ForbiddenException('Firma HMAC requerida (x-hub-signature-256)');
      }

      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')}`;

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        throw new ForbiddenException('Firma HMAC de GitHub inválida');
      }
    }

    if (event === 'push') {
      const username = body.sender?.login || body.repository?.owner?.login;
      if (username && typeof username === 'string') {
        await this.cacheAdapter.flushPattern(username);
        logger.info(`GitHub webhook push event: invalidated cache for ${username}`, { username });
        return { message: `Caché invalidada para ${username}`, invalidated: true };
      }
    }

    return { message: 'Evento de webhook procesado', invalidated: false };
  }
}
