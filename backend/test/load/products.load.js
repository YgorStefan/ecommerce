// Teste de carga (k6) dos endpoints públicos de catálogo — a rota mais acessada
// de qualquer e-commerce (listagem e detalhe de produto). Simula usuários
// navegando pela loja e valida latência e taxa de erro sob carga.
//
// Como rodar (com o backend no ar):
//   k6 run backend/test/load/products.load.js
//   BASE_URL=http://localhost:3001 k6 run backend/test/load/products.load.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  // Rampa: sobe até 50 usuários simultâneos, mantém e desce
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 95% das requisições devem responder em menos de 500ms
    http_req_duration: ['p(95)<500'],
    // Menos de 1% de erros
    errors: ['rate<0.01'],
  },
};

export default function () {
  // Listagem de produtos (primeira página)
  const listRes = http.get(`${BASE_URL}/api/products?page=1&limit=12`);
  const listOk = check(listRes, {
    'listagem status 200': (r) => r.status === 200,
    'listagem retorna dados': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body?.data?.products);
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!listOk);

  // Se houver produtos, acessa o detalhe do primeiro pelo slug
  try {
    const products = listRes.json()?.data?.products;
    if (Array.isArray(products) && products.length > 0) {
      const slug = products[0].slug;
      const detailRes = http.get(`${BASE_URL}/api/products/${slug}`);
      const detailOk = check(detailRes, {
        'detalhe status 200': (r) => r.status === 200,
      });
      errorRate.add(!detailOk);
    }
  } catch {
    errorRate.add(true);
  }

  sleep(1);
}
