#!/bin/bash
# deploy.sh — commit local changes and deploy to Vercel + Railway
# Uso: bash deploy.sh "mensagem do commit"

set -e

RAILWAY_TOKEN="0kzDCxKpCuCPbMMHjwaGDsu2Y0gQA2M6sUJAoiwY58k"
RAILWAY_PROJECT="b64a1819-3b67-4e51-a816-60c3532575d1"
RAILWAY_ENV="958f7001-0fa0-4db4-988f-6aeec8e8972d"
RAILWAY_BACKEND_SVC="e683dade-f92d-4826-8bc2-ff35975d6c4e"
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
