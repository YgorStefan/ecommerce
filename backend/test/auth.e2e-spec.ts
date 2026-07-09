import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, uniqueEmail } from './utils/test-app';

describe('Autenticação (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const password = 'senhaForte123';

  it('deve cadastrar um novo usuário e definir cookies httpOnly', async () => {
    const email = uniqueEmail('cadastro');

    const res = await request(server)
      .post('/api/auth/register')
      .send({ name: 'Usuário Teste', email, password })
      .expect(201);

    expect(res.body.data.user.email).toBe(email);
    // A senha jamais deve ser exposta na resposta
    expect(res.body.data.user.password).toBeUndefined();

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    // Cookies de autenticação devem ser httpOnly
    expect(cookies.every((c) => c.toLowerCase().includes('httponly'))).toBe(true);
  });

  it('não deve permitir cadastro duplicado com o mesmo e-mail', async () => {
    const email = uniqueEmail('duplicado');
    await request(server).post('/api/auth/register').send({ name: 'Fulano', email, password }).expect(201);

    await request(server)
      .post('/api/auth/register')
      .send({ name: 'Fulano B', email, password })
      .expect(409);
  });

  it('deve rejeitar senha menor que 8 caracteres no cadastro', async () => {
    await request(server)
      .post('/api/auth/register')
      .send({ name: 'Curto', email: uniqueEmail('curto'), password: '123' })
      .expect(400);
  });

  it('deve autenticar com credenciais válidas', async () => {
    const email = uniqueEmail('login');
    await request(server).post('/api/auth/register').send({ name: 'Login User', email, password }).expect(201);

    const res = await request(server).post('/api/auth/login').send({ email, password }).expect(200);

    expect(res.body.data.user.email).toBe(email);
  });

  it('deve rejeitar credenciais inválidas', async () => {
    const email = uniqueEmail('invalido');
    await request(server).post('/api/auth/register').send({ name: 'Fulano X', email, password }).expect(201);

    await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'senhaErrada123' })
      .expect(401);
  });

  it('deve bloquear acesso a rota protegida sem autenticação', async () => {
    await request(server).get('/api/users/me').expect(401);
  });

  it('deve permitir acesso à rota protegida com o cookie de sessão e renovar tokens', async () => {
    const email = uniqueEmail('sessao');
    const agent = request.agent(server);

    await agent.post('/api/auth/register').send({ name: 'Sessão', email, password }).expect(201);

    const me = await agent.get('/api/users/me').expect(200);
    expect(me.body.data.email).toBe(email);

    // Renovação de tokens não deve exigir nenhum dado no corpo — usa o cookie refreshToken
    const refresh = await agent.post('/api/auth/refresh').send({}).expect(200);
    expect(refresh.body.data.success).toBe(true);

    // Logout deve limpar a sessão e bloquear acesso subsequente
    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/users/me').expect(401);
  });

  it('forgot-password deve sempre responder com sucesso, exista ou não o e-mail (evita enumeração)', async () => {
    const existente = uniqueEmail('esqueci');
    await request(server).post('/api/auth/register').send({ name: 'Fulano Y', email: existente, password }).expect(201);

    const resExistente = await request(server)
      .post('/api/auth/forgot-password')
      .send({ email: existente })
      .expect(200);

    const resInexistente = await request(server)
      .post('/api/auth/forgot-password')
      .send({ email: uniqueEmail('naoexiste') })
      .expect(200);

    expect(resExistente.body.data.message).toBe(resInexistente.body.data.message);
  });

  it('reset-password deve rejeitar um token inválido', async () => {
    await request(server)
      .post('/api/auth/reset-password')
      .send({ token: 'token-invalido-qualquer', newPassword: 'outraSenha123' })
      .expect(400);
  });
});
