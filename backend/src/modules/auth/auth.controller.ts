// expõe os endpoints de registro, login e tokens

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

// Limite mais rígido para rotas sensíveis a força-bruta: 5 tentativas por minuto por IP
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60000 } };

// Opções de cookie compartilhadas entre criação e limpeza — precisam ser idênticas
// para que o navegador realmente remova o cookie no logout
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// @ApiTags agrupa os endpoints no Swagger UI
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // POST /api/auth/register — cadastro de novo usuário
  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    // Delega o processamento para o serviço de autenticação
    const result = await this.authService.register(registerDto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  // POST /api/auth/login — autenticação com e-mail e senha
  @Post('login')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK) // Retorna 200 em vez de 201 para login
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  // POST /api/auth/refresh — renova o access token usando o refresh token
  @Post('refresh')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens de acesso' })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou ausente' })
  async refreshTokens(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    // O ID do usuário é extraído e validado a partir do próprio token — nunca
    // aceito diretamente do corpo da requisição (evita que o cliente informe
    // um userId arbitrário)
    const result = await this.authService.refreshTokens(refreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { success: true };
  }

  // POST /api/auth/logout — invalida o refresh token do usuário
  @Post('logout')
  @UseGuards(JwtAuthGuard) // Exige autenticação para fazer logout
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth() // Indica no Swagger que requer token Bearer
  @ApiOperation({ summary: 'Realizar logout' })
  async logout(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    // @CurrentUser() extrai o usuário autenticado da requisição
    await this.authService.logout(user.id);
    res.clearCookie('accessToken', ACCESS_COOKIE_OPTIONS);
    res.clearCookie('refreshToken', ACCESS_COOKIE_OPTIONS);
    return { success: true };
  }

  // POST /api/auth/forgot-password — envia e-mail com link de recuperação de senha
  @Post('forgot-password')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  @ApiResponse({ status: 200, description: 'Se o e-mail existir, um link de recuperação será enviado' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    // Resposta idêntica independente do e-mail existir ou não (evita enumeração de usuários)
    return { message: 'Se o e-mail informado estiver cadastrado, você receberá um link de recuperação.' };
  }

  // POST /api/auth/reset-password — redefine a senha usando o token recebido por e-mail
  @Post('reset-password')
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token de recuperação' })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Senha redefinida com sucesso' };
  }

  // Define os cookies httpOnly de acesso e renovação com as opções corretas de segurança
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, { ...ACCESS_COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...ACCESS_COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
}
