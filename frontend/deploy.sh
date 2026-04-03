#!/bin/bash
# Deploy apenas do Frontend Next.js
cd ~/domains/ygorstefan.com/public_html/ecommerce/frontend
git pull origin main
npm ci
npm run build
echo "Frontend deploy concluido! Reinicie o app Node.js no hPanel."
