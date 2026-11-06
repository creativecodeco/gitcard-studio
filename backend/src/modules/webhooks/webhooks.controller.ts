import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Req
} from '@nestjs/common';
import crypto from 'node:crypto';
import { RedisCacheAdapter } from '@/infrastructure/cache/RedisCacheAdapter';
import { logger } from '@/infrastructure/logging/logger';
import { safeTimingEqual } from '@/infrastructure/security/security';
import { GITHUB_USERNAME_REGEX } from '@/domain/entities/Validation';

@Controller('api/webhooks')
export class WebhooksController {
  private readonly cacheAdapter = new RedisCacheAdapter();

  @Post('github')
  @HttpCode(HttpStatus.OK)
  async handleGitHubWebhook(
    @Body() body: any,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Req() req?: { rawBody?: Buffer | string }
  ): Promise<{ message: string; invalidated: boolean }> {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!webhookSecret && process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'GITHUB_WEBHOOK_SECRET es obligatorio en entorno de producción.'
      );
    }

    // If secret is set, verify HMAC signature over rawBody (with JSON fallback)
    if (webhookSecret) {
      if (!signature) {
        throw new ForbiddenException('Firma HMAC requerida (x-hub-signature-256)');
      }

      let payloadBuffer: Buffer;
      if (Buffer.isBuffer(req?.rawBody)) {
        payloadBuffer = req.rawBody;
      } else if (typeof req?.rawBody === 'string') {
        payloadBuffer = Buffer.from(req.rawBody, 'utf8');
      } else {
        payloadBuffer = Buffer.from(JSON.stringify(body ?? {}), 'utf8');
      }

      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadBuffer)
        .digest('hex')}`;

      if (!safeTimingEqual(signature, expectedSignature)) {
        throw new ForbiddenException('Firma HMAC de GitHub inválida');
      }
    }

    if (event === 'push') {
      const username = body?.sender?.login || body?.repository?.owner?.login;
      if (typeof username === 'string' && GITHUB_USERNAME_REGEX.test(username)) {
        await this.cacheAdapter.flushPattern(username);
        logger.info(`GitHub webhook push event: invalidated cache for ${username}`, { username });
        return { message: `Caché invalidada para ${username}`, invalidated: true };
      }
    }

    return { message: 'Evento de webhook procesado', invalidated: false };
  }
}
