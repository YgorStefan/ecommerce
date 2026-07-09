// Teste de carga (k6) do endpoint de login — mede o comportamento da autenticação
// (que envolve hash de senha com bcrypt, operação intencionalmente custosa) sob
// concorrência. Também exercita o rate limiting do backend.
//
// Pré-requisito: exista um usuário de teste com as credenciais abaixo. Ajuste via
// variáveis de ambiente conforme o seed do seu ambiente.
//
// Como rodar:
//   LOGIN_EMAIL=cliente@teste.com LOGIN_PASSWORD=senha12345 \
//     k6 run backend/test/load/auth.load.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const EMAIL = __ENV.LOGIN_EMAIL || 'cliente@teste.com';
const PASSWORD = __ENV.LOGIN_PASSWORD || 'senha12345';

export const options = {
  // Carga moderada — login é caro (bcrypt) e protegido por rate limit
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 20 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    // Login é intencionalmente lento (bcrypt); tolerância maior que endpoints de leitura
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const payload = JSON.stringify({ email: EMAIL, password: PASSWORD });
  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  // 200 (sucesso) e 429 (rate limit) são respostas esperadas sob carga; ambas
  // indicam que o servidor está se comportando corretamente
  const ok = check(res, {
    'login respondeu 200 ou 429': (r) => r.status === 200 || r.status === 429,
  });
  errorRate.add(!ok);

  sleep(1);
}
