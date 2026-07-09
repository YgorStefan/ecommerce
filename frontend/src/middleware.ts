// Middleware de proteção de rotas (executa no edge, no servidor).
//
// Barreira de defesa em profundidade: impede que a casca (shell) das áreas
// autenticadas seja servida a visitantes não logados e evita o "flash" de
// conteúdo antes do redirect client-side. A autorização definitiva continua
// sendo feita pelo backend em cada requisição de API.
//
// Se `JWT_ACCESS_SECRET` estiver configurado no ambiente do frontend, o token é
// verificado criptograficamente aqui (inclusive o papel de admin). Caso não
// esteja, o middleware faz apenas a checagem de presença do cookie de sessão —
// o backend segue como fonte de verdade da autorização.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_COOKIE = 'accessToken';

interface TokenPayload {
  sub: string;
  email?: string;
  role?: string;
}

// Verifica o token quando há segredo configurado. Retorna o payload se válido,
// `null` se inválido/expirado e `undefined` quando não há segredo para verificar.
async function verifyToken(token: string): Promise<TokenPayload | null | undefined> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return undefined;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;

  const isAuthArea = pathname === '/login' || pathname === '/register';
  const isAccountArea = pathname.startsWith('/account');
  const isAdminArea = pathname.startsWith('/admin');

  const payload = token ? await verifyToken(token) : undefined;
  // Considera "autenticado" quando o token é válido (secret configurado) ou,
  // sem secret para verificar, quando o cookie simplesmente existe
  const isAuthenticated = payload === undefined ? Boolean(token) : payload !== null;

  // Usuário logado não deve ver login/registro
  if (isAuthArea && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Áreas que exigem autenticação
  if ((isAccountArea || isAdminArea) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Área admin exige papel admin — só é verificável quando há secret configurado
  if (isAdminArea && payload && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/login', '/register'],
};
