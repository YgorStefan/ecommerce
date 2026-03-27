// Guard que verifica se o usuário está autenticado via JWT

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Estende o AuthGuard do Passport com a estratégia 'jwt'
// Quando aplicado a uma rota, exige um token JWT válido no header Authorization
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
