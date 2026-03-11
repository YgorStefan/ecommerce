// users.module.ts
// Módulo de usuários

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  // Registra a entidade User para uso com TypeORM neste módulo
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  // Exporta o serviço para uso em outros módulos (ex: AuthModule)
  exports: [UsersService],
})
export class UsersModule {}
