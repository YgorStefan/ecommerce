// jwt.strategy.ts
// Estratégia Passport para validar tokens JWT de acesso

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Interface que define o payload contido no JWT
export interface JwtPayload {
  sub: string; // ID do usuário (subject)
  email: string; // E-mail do usuário
  role: string; // Papel do usuário (admin/user)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      // Extrai o JWT do header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rejeita automaticamente tokens expirados
      ignoreExpiration: false,
      // Chave secreta para verificar a assinatura do token
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  // Este método é chamado automaticamente após a validação da assinatura do JWT
  async validate(payload: JwtPayload) {
    // Busca o usuário no banco usando o ID do payload
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    // Se o usuário não existe ou está inativo, rejeita a autenticação
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    // O objeto retornado é injetado na propriedade request.user
    return user;
  }
}
