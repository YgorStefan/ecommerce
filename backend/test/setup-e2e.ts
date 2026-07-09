// Configura as variáveis de ambiente usadas pelos testes E2E antes de qualquer
// módulo do Nest ser carregado. dotenv (usado internamente pelo ConfigModule)
// nunca sobrescreve variáveis já definidas em process.env, então estes valores
// têm prioridade sobre qualquer .env presente no projeto.

process.env.NODE_ENV = 'test';

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3307';
process.env.DB_USER = process.env.DB_USER || 'ecommerce';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'ecommerce123';
process.env.DB_NAME = process.env.DB_NAME || 'ecommerce_db';
// Cria/atualiza o schema automaticamente no banco de teste — nunca usar em produção
process.env.DB_SYNC = 'true';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Portas dedicadas para a instância de backend usada pelos testes E2E do
// frontend (Playwright) — evitam colidir com um backend/frontend de
// desenvolvimento que porventura já esteja rodando nas portas padrão (3000/3001)
process.env.BACKEND_PORT = process.env.BACKEND_PORT || '3901';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3900';

// Host/porta inválidos propositalmente: falha rápido com ECONNREFUSED em vez de
// tentar (e travar) uma conexão real com um servidor SMTP durante os testes
process.env.MAIL_HOST = '127.0.0.1';
process.env.MAIL_PORT = '1';
process.env.MAIL_USER = 'test@test.com';
process.env.MAIL_PASSWORD = 'test';

// Sem chave configurada, o StripeService acusa "não configurado" em vez de
// falhar — suficiente para os fluxos e2e que não usam cartão
process.env.STRIPE_SECRET_KEY = '';
process.env.STRIPE_WEBHOOK_SECRET = '';

process.env.SHIPPING_ORIGIN_ZIP = '01001000';
