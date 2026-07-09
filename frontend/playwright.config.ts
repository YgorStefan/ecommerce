import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Configuração dos testes E2E do frontend — sobe o backend (apontando para o
// banco de dados de teste) e o frontend Next.js antes de rodar os testes.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Os fluxos de compra/admin compartilham o mesmo banco de teste
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }]],
  globalSetup: require.resolve('./e2e/global-setup'),
  timeout: 60000,

  use: {
    baseURL: 'http://localhost:3900',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Portas incomuns (3900/3901) minimizam o risco de colidir com algum
  // frontend/backend de desenvolvimento (deste ou de outro projeto) já
  // rodando na máquina nas portas padrão 3000/3001
  webServer: [
    {
      // Backend real, configurado para usar o banco de dados de teste isolado
      // (ver backend/test/setup-e2e.ts) — mesma stack usada pelos testes e2e do backend
      command: 'npm run start:e2e',
      cwd: path.join(__dirname, '../backend'),
      url: 'http://localhost:3901/api/docs',
      env: { BACKEND_PORT: '3901', FRONTEND_URL: 'http://localhost:3900' },
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'npm run build && npm run start -- -p 3900',
      cwd: __dirname,
      url: 'http://localhost:3900',
      env: { PORT: '3900', NEXT_PUBLIC_API_URL: 'http://localhost:3901' },
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
  ],
});
