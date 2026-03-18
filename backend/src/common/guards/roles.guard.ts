// roles.guard.ts
// Guard que verifica se o usuário autenticado tem o papel necessário para acessar a rota

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // Injeta o Reflector para ler os metadados definidos pelo @Roles()
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtém os papéis necessários definidos pelo decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [
        context.getHandler(), // Metadados do método específico
        context.getClass(), // Metadados da classe (controller)
      ],
    );

    // Se não há papéis definidos, a rota é pública para usuários autenticados
    if (!requiredRoles) {
      return true;
    }

    // Obtém o usuário autenticado da requisição (injetado pelo JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Verifica se o papel do usuário está na lista de papéis permitidos
    return requiredRoles.some((role) => user.role === role);
  }
}
