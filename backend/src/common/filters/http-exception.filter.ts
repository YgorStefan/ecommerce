// http-exception.filter.ts
// Filtro global que intercepta todas as exceções HTTP e formata a resposta de erro

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// @Catch() sem argumentos captura todas as exceções
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // Logger para registrar os erros no console do servidor
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // Obtém o contexto HTTP da requisição atual
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Define o status HTTP: usa o da exceção ou 500 para erros não tratados
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Obtém a mensagem de erro da exceção HTTP
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Extrai a mensagem de forma adequada (pode ser string ou objeto)
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Erro interno do servidor';

    // Registra o erro no log com detalhes para debugging
    this.logger.error(
      `${request.method} ${request.url} - ${status}: ${JSON.stringify(message)}`,
    );

    // Retorna a resposta de erro formatada de forma padronizada
    response.status(status).json({
      statusCode: status,       // Código HTTP do erro
      timestamp: new Date().toISOString(), // Momento em que o erro ocorreu
      path: request.url,        // Rota que gerou o erro
      message,                  // Mensagem descritiva do erro
    });
  }
}
