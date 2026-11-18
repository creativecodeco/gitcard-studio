import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';
import fastifyEtag from '@fastify/etag';
import path from 'node:path';
import dotenv from 'dotenv';
import { AppModule } from './app.module';
import { initDatabase } from '@/infrastructure/database/database';
import { logger } from '@/infrastructure/logging/logger';
import { validateEnvConfig } from '@/infrastructure/config/env.config';
import { AllExceptionsFilter } from '@/infrastructure/filters/all-exceptions.filter';

dotenv.config();
validateEnvConfig();

const PORT = process.env.PORT || 3000;

export async function bootstrap(): Promise<NestFastifyApplication> {
  await initDatabase();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      keepAliveTimeout: 65000,
      bodyLimit: 64 * 1024 // 64 KB max JSON/raw request body size
    }),
    { rawBody: true }
  );

  // Register security headers via Fastify Helmet
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false // Keep CSP false to allow SVG card rendering inside img tags
  });

  // Register CORS: restrict cross-origin requests when CORS_ORIGIN or PUBLIC_URL is configured
  const allowedOrigin = process.env.CORS_ORIGIN || process.env.PUBLIC_URL;
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      if (!origin || !allowedOrigin || origin === allowedOrigin) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
  });

  // Register tiered rate limiting for /api/ endpoints (OWASP A05 / DoS & brute-force protection)
  // Uses separate key buckets so high-volume SVG card renders never starve auth/metrics endpoints
  const defaultRateMax = Number(process.env.RATE_LIMIT_MAX || 300);
  const sensitiveRateMax = Number(process.env.SENSITIVE_RATE_LIMIT_MAX || 60);
  const isSensitiveEndpoint = (rawUrl?: string): boolean => {
    const url = rawUrl || '';
    if (url.startsWith('/api/metrics/users/count')) {
      return false;
    }
    return (
      url.startsWith('/api/metrics') ||
      url.startsWith('/api/tokens') ||
      url.startsWith('/api/auth') ||
      url.startsWith('/api/users/purge') ||
      url.startsWith('/api/users/export') ||
      url.startsWith('/api/webhooks')
    );
  };

  await app.register(fastifyRateLimit, {
    keyGenerator: (req) => {
      const bucket = isSensitiveEndpoint(req.url) ? 'sensitive' : 'general';
      return `${bucket}:${req.ip}`;
    },
    max: (req) => (isSensitiveEndpoint(req.url) ? sensitiveRateMax : defaultRateMax),
    timeWindow: '1 minute',
    allowList: (req) => !req.url?.startsWith('/api/')
  });

  // Register Fastify compression (brotli & gzip) for high-performance payload delivery
  await app.register(fastifyCompress, {
    global: true,
    encodings: ['br', 'gzip', 'deflate']
  });

  // Register Fastify ETag support for 304 Not Modified responses
  await app.register(fastifyEtag);

  // Serve public static assets
  const publicDir = path.resolve(__dirname, '../../public');
  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: '/',
    extensions: ['html'],
    decorateReply: true,
    setHeaders: (res: any, filePath: string) => {
      const setHeader = (key: string, val: string) => {
        if (typeof res.setHeader === 'function') {
          res.setHeader(key, val);
        } else if (typeof res.header === 'function') {
          res.header(key, val);
        } else if (res.raw && typeof res.raw.setHeader === 'function') {
          res.raw.setHeader(key, val);
        }
      };

      if (filePath.includes('/_astro/')) {
        setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        setHeader('Cache-Control', 'no-cache, must-revalidate');
        setHeader('X-Frame-Options', 'DENY');
        setHeader('X-Content-Type-Options', 'nosniff');
        setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        setHeader(
          'Content-Security-Policy',
          "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
        );
      }
    }
  });

  // Global exception filter: centralize error logging, prevent stack trace leaks
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global pipe for runtime DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  app.enableShutdownHooks();

  await app.listen(PORT, '0.0.0.0');
  logger.info(`🚀 NestJS Fastify server running on http://localhost:${PORT}`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });

  return app;
}

// Automatically boot if executed directly
if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error('Failed to start NestJS Fastify server:', { error: err });
    process.exit(1);
  });
}
