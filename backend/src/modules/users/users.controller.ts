// Controller de usuários

import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Post,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, AdminUpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from './entities/user.entity';

@ApiTags('Usuários')
@ApiBearerAuth() // Todos os endpoints deste controller exigem autenticação
@UseGuards(JwtAuthGuard) // Aplica o guard JWT em todos os métodos
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  // POST /api/users/promote-admin — endpoint temporário de seed (removido após uso)
  @Post('promote-admin')
  @UseGuards()
  async promoteAdmin(
    @Headers('x-seed-token') token: string,
    @Body() body: { email: string },
  ) {
    if (token !== process.env.SEED_TOKEN) throw new ForbiddenException();
    await this.usersRepository.update({ email: body.email }, { role: UserRole.ADMIN });
    return { promoted: body.email };
  }

  // GET /api/users/me — retorna o perfil do usuário autenticado
  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  getProfile(@CurrentUser() user: User) {
    // O usuário já está disponível via @CurrentUser() injetado pelo JwtStrategy
    return user;
  }

  // PATCH /api/users/me — atualiza o perfil do usuário autenticado
  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  // POST /api/users/me/change-password — altera a senha do usuário
  @Post('me/change-password')
  @ApiOperation({ summary: 'Alterar senha do usuário' })
  changePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  // GET /api/users — lista todos os usuários
  @Get()
  @UseGuards(RolesGuard) // Aplica verificação de papel além do JWT
  @Roles(UserRole.ADMIN) // Apenas admins podem acessar
  @ApiOperation({ summary: '[Admin] Listar todos os usuários' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll(page, limit);
  }

  // GET /api/users/:id — busca um usuário por ID
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Buscar usuário por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // PATCH /api/users/:id — atualiza usuário
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Atualizar dados de usuário' })
  adminUpdate(
    @Param('id') id: string,
    @Body() adminUpdateDto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdate(id, adminUpdateDto);
  }

  // DELETE /api/users/:id — remove usuário com soft delete
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Remover usuário' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
