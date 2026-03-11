// current-user.decorator.ts
// Decorator personalizado para extrair o usuário autenticado da requisição

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// @CurrentUser() pode ser usado nos parâmetros de métodos de controller
// para obter o usuário autenticado sem precisar acessar a requisição manualmente
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // Obtém o objeto de requisição HTTP do contexto de execução
    const request = ctx.switchToHttp().getRequest();
    // Retorna o usuário injetado pelo JwtAuthGuard na propriedade "user"
    return request.user;
  },
);
