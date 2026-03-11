// auth.controller.ts
// Controller de autenticação — expõe os endpoints de registro, login e tokens

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

// @ApiTags agrupa os endpoints no Swagger UI
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  // Injeta o serviço de autenticação
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register — cadastro de novo usuário
  @Post('register')
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async register(@Body() registerDto: RegisterDto) {
    // Delega o processamento para o serviço de autenticação
    return this.authService.register(registerDto);
  }

  // POST /api/auth/login — autenticação com e-mail e senha
  @Post('login')
  @HttpCode(HttpStatus.OK) // Retorna 200 em vez de 201 para login
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // POST /api/auth/refresh — renova o access token usando o refresh token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  async refreshTokens(
    @Body() body: { userId: string; refreshToken: string },
  ) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  // POST /api/auth/logout — invalida o refresh token do usuário
  @Post('logout')
  @UseGuards(JwtAuthGuard) // Exige autenticação para fazer logout
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth() // Indica no Swagger que requer token Bearer
  @ApiOperation({ summary: 'Realizar logout' })
  async logout(@CurrentUser() user: User) {
    // @CurrentUser() extrai o usuário autenticado da requisição
    return this.authService.logout(user.id);
  }
}
