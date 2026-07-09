// Filtro global de exceções — padroniza respostas de erro e registra logs
// estruturados sem nunca expor dados sensíveis (senhas, tokens, dados de cartão).

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    const message = isHttpException
      ? this.extractMessage(exceptionResponse)
      : 'Erro interno do servidor';

    // Loga apenas metadados da requisição — nunca o body (pode conter senha,
    // dados de cartão ou outras informações sensíveis)
    const logContext = `${request.method} ${request.originalUrl} -> ${status}`;
    const messageText = Array.isArray(message) ? message.join(', ') : message;
    if (status >= 500) {
      this.logger.error(
        logContext,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(`${logContext} — ${messageText}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: isHttpException ? exception.name : 'InternalServerError',
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }

  private extractMessage(exceptionResponse: unknown): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      return (exceptionResponse as { message: string | string[] }).message;
    }
    return 'Erro inesperado';
  }
}
