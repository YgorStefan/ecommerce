// Interceptor de log estruturado — registra método, rota, status e duração de cada
// requisição para fins de auditoria. NUNCA loga o corpo da requisição/resposta,
// pois pode conter senhas, tokens ou dados de pagamento.

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl } = request;
    const start = Date.now();
    const user = (request as any).user as
      | { id?: string; email?: string }
      | undefined;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const actor = user ? ` [user:${user.id}]` : '';
        this.logger.log(
          `${method} ${originalUrl} ${response.statusCode} +${duration}ms${actor}`,
        );
      }),
    );
  }
}
