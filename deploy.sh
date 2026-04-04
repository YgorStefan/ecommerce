#!/bin/bash
# deploy.sh — commit local changes and deploy to Vercel + Railway
# Uso: bash deploy.sh "mensagem do commit"
#
# Antes de usar: copie .env.deploy.example para .env.deploy e preencha os valores.

set -e

# Carrega variáveis do .env.deploy se existir
if [ -f "$(dirname "$0")/.env.deploy" ]; then
  set -a
  source "$(dirname "$0")/.env.deploy"
  set +a
fi

RAILWAY_TOKEN="${RAILWAY_TOKEN:?Defina RAILWAY_TOKEN no arquivo .env.deploy}"
RAILWAY_PROJECT="${RAILWAY_PROJECT:?Defina RAILWAY_PROJECT no arquivo .env.deploy}"
RAILWAY_ENV="${RAILWAY_ENV:?Defina RAILWAY_ENV no arquivo .env.deploy}"
RAILWAY_BACKEND_SVC="${RAILWAY_BACKEND_SVC:?Defina RAILWAY_BACKEND_SVC no arquivo .env.deploy}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ── 1. Commit message ────────────────────────────────────────────────────────
MSG="${1:-chore: update}"
echo ""
echo "📦  Commit: \"$MSG\""

# ── 2. Git ───────────────────────────────────────────────────────────────────
cd "$ROOT_DIR"

if [ -z "$(git status --porcelain)" ]; then
  echo "ℹ️   Sem mudanças para commitar."
else
  git add -A
  git commit -m "$MSG"
  git push origin main
  echo "✅  Push para o GitHub feito."
fi

COMMIT_SHA=$(git rev-parse HEAD)

# ── 3. Vercel ────────────────────────────────────────────────────────────────
echo ""
echo "🚀  Deployando frontend no Vercel..."
cd "$FRONTEND_DIR"
vercel --prod --yes 2>&1 | grep -E "Production:|Inspect:|Error|error" || true
echo "✅  Vercel: https://frontend-nine-mocha-28.vercel.app"

# ── 4. Railway ───────────────────────────────────────────────────────────────
echo ""
echo "🚂  Deployando backend no Railway..."

railway_gql() {
  curl -s -X POST https://backboard.railway.app/graphql/v2 \
    -H "Authorization: Bearer $RAILWAY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$1"
}

railway_gql "{\"query\":\"mutation { serviceInstanceDeploy(environmentId: \\\"$RAILWAY_ENV\\\", serviceId: \\\"$RAILWAY_BACKEND_SVC\\\", commitSha: \\\"$COMMIT_SHA\\\", latestCommit: true) }\"}" > /dev/null
echo "   Deploy iniciado..."

# ── 5. Aguardar Railway ──────────────────────────────────────────────────────
for i in $(seq 1 24); do
  sleep 15
  STATUS=$(railway_gql "{\"query\":\"{ project(id: \\\"$RAILWAY_PROJECT\\\") { services { edges { node { name deployments(first: 1) { edges { node { status } } } } } } } }\"}" \
    | python -c "
import json,sys
data=json.load(sys.stdin)
for e in data['data']['project']['services']['edges']:
    s=e['node']
    if s['name']=='backend':
        dep=s['deployments']['edges']
        print(dep[0]['node']['status'] if dep else 'UNKNOWN')
" 2>/dev/null)
  printf "   [%ds] Railway: %s\n" $((i * 15)) "$STATUS"
  if [ "$STATUS" = "SUCCESS" ]; then
    echo "✅  Railway: https://backend-production-b555.up.railway.app"
    break
  elif [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CRASHED" ]; then
    echo "❌  Railway falhou (status: $STATUS)."
    echo "    Veja os logs: https://railway.com/project/$RAILWAY_PROJECT"
    exit 1
  fi
done

# ── 6. Resumo ────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  Deploy concluído!"
echo "  Frontend : https://frontend-nine-mocha-28.vercel.app"
echo "  Backend  : https://backend-production-b555.up.railway.app"
echo "════════════════════════════════════════════"
