#!/bin/bash
# Deploy apenas do Backend NestJS
cd ~/domains/ygorstefan.com/public_html/ecommerce/backend
git pull origin main
npm ci --omit=dev
npm run build
echo "Backend deploy concluido! Reinicie o app Node.js no hPanel."
