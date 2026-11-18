import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '@/infrastructure/logging/logger';

/**
 * Global exception filter that catches all unhandled exceptions.
 * Ensures no stack traces or internal error details are leaked to the client.
 * All unexpected errors are logged server-side with full context.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();

    const isHttpException = exception instanceof HttpException;
    const rawStatusCode =
      !isHttpException &&
      typeof exception === 'object' &&
      exception !== null &&
      'statusCode' in exception &&
      typeof (exception as { statusCode?: unknown }).statusCode === 'number'
        ? (exception as { statusCode: number }).statusCode
        : undefined;
    const status = isHttpException
      ? exception.getStatus()
      : (rawStatusCode ?? HttpStatus.INTERNAL_SERVER_ERROR);
    const isClientError = status >= 400 && status < 500;

    if (!isClientError) {
      logger.error('Unhandled exception caught by AllExceptionsFilter', {
        method: req.method,
        url: req.url,
        status,
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined
      });
    }

    let message: Record<string, unknown>;
    if (isHttpException) {
      message = exception.getResponse() as Record<string, unknown>;
    } else if (isClientError && exception instanceof Error) {
      message = { statusCode: status, message: exception.message };
    } else {
      message = { statusCode: status, message: 'Internal server error' };
    }

    res.status(status).send(message);
  }
}
