// roles.decorator.ts
// Decorator @Roles() para definir quais papéis têm acesso a uma rota

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';

// Chave de metadado usada pelo RolesGuard para verificar os papéis necessários
export const ROLES_KEY = 'roles';

// @Roles(UserRole.ADMIN) marca uma rota como acessível apenas por admins
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
