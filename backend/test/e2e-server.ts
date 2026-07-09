// Sobe uma instância real do backend (mesma configuração de main.ts) apontando
// para o banco de dados de teste, para ser usada pelos testes E2E do frontend
// (Playwright), que precisam de uma API HTTP de verdade rodando na porta 3001.

import './setup-e2e';
import '../src/main';
