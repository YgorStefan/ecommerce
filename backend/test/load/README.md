# Testes de carga (k6)

Scripts de teste de carga para os endpoints mais críticos da API, usando [k6](https://k6.io).

## Pré-requisitos

- k6 instalado ([instruções](https://grafana.com/docs/k6/latest/set-up/install-k6/)).
- Backend rodando e acessível (por padrão em `http://localhost:3001`).
- Banco de dados com dados de catálogo para o teste de produtos.

## Scripts

| Script | O que exercita |
| --- | --- |
| `products.load.js` | Listagem e detalhe de produtos (leitura pública, alto tráfego) |
| `auth.load.js` | Login (bcrypt + rate limiting) |

## Como executar

```bash
# Catálogo (endpoints públicos)
k6 run backend/test/load/products.load.js

# Apontando para outra URL
BASE_URL=http://localhost:3001 k6 run backend/test/load/products.load.js

# Login — informe credenciais de um usuário existente
LOGIN_EMAIL=cliente@teste.com LOGIN_PASSWORD=senha12345 \
  k6 run backend/test/load/auth.load.js
```

## Metas (thresholds)

- **Catálogo:** p95 < 500ms e taxa de erro < 1%.
- **Login:** p95 < 1500ms (bcrypt é intencionalmente custoso). Respostas `429`
  sob carga são esperadas — indicam que o rate limiting está protegendo a API.

Os resultados detalhados podem ser salvos em `backend/test/load/results/`
(pasta ignorada pelo Git) com a flag `--summary-export`.
