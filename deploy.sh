#!/bin/bash
# Deploy do E-commerce na Hostinger
# Caminho no servidor: ~/domains/ygorstefan.com/public_html/ecommerce
# Uso: bash deploy.sh

set -e

DEPLOY_PATH=~/domains/ygorstefan.com/public_html/ecommerce

echo "=== Deploy E-commerce ==="

echo "[1/5] Puxando atualizacoes do GitHub..."
cd $DEPLOY_PATH
git pull origin main

echo "[2/5] Instalando dependencias do backend..."
cd $DEPLOY_PATH/backend
npm ci --omit=dev

echo "[3/5] Compilando backend..."
npm run build

echo "[4/5] Instalando dependencias do frontend..."
cd $DEPLOY_PATH/frontend
npm ci

echo "[5/5] Gerando build do frontend..."
npm run build

echo ""
echo "=== Deploy concluido! ==="
echo "Reinicie os dois apps Node.js no hPanel."
