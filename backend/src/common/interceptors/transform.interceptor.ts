// Interceptor que padroniza o formato de todas as respostas de sucesso da API

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface que define o formato padrão das respostas de sucesso
export interface ApiResponse<T> {
  data: T; // Dados retornados pelo endpoint
  statusCode: number; // Código HTTP (200, 201, etc.)
  message: string; // Mensagem descritiva
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // Obtém o status HTTP da resposta atual
    const statusCode = context.switchToHttp().getResponse().statusCode;

    // Encapsula o dado retornado pelo handler no formato padronizado
    return next.handle().pipe(
      map((data) => ({
        data, // Dados originais retornados pelo controller/service
        statusCode, // Código HTTP da resposta
        message: 'Operação realizada com sucesso',
      })),
    );
  }
}
