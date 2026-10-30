import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export interface AppErrorPayload {
  code: string;
  message: string;
  fix: string;
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  fix: string;

  constructor(statusCode: number, code: string, message: string, fix: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fix = fix;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function setupErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | AppError | ZodError, request: FastifyRequest, reply: FastifyReply) => {
    // 1. Zod Validation Error
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      const field = firstIssue.path.join('.') || 'input';
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_FAILED',
          message: `Invalid value for ${field}: ${firstIssue.message}`,
          fix: `Please correct the ${field} field and submit again.`,
        },
      });
    }

    // 2. Custom AppError
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          fix: error.fix,
        },
      });
    }

    // 3. Fastify Schema Validation Error
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'SCHEMA_VALIDATION_ERROR',
          message: error.message,
          fix: 'Check the submitted request fields against the OpenAPI contract.',
        },
      });
    }

    // 4. Fallback Internal Server Error
    request.log.error(error);
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: statusCode === 500 ? 'An unexpected server error occurred.' : error.message,
        fix: 'Please retry in a few seconds or contact LocalKart Pollachi support.',
      },
    });
  });
}
