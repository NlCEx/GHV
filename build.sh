#!/bin/bash
set -e
echo "==> Instalando dependencias do frontend..."
cd frontend && npm install
echo "==> Compilando frontend..."
npm run build
echo "==> Instalando dependencias do backend..."
cd ../backend && npm install
echo "==> Build concluido!"
