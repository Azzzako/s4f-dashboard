#!/usr/bin/env bash
# First-time setup: install pm2 globally if missing, install deps,
# build, and start the dashboard under pm2.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT=7777
APP="s4f-admin"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "→ Instalando pm2 globalmente…"
  npm install -g pm2
fi

echo "→ Instalando dependencias…"
npm ci --silent || npm install --silent

echo "→ Compilando…"
npm run build

if pm2 describe "$APP" >/dev/null 2>&1; then
  pm2 delete "$APP"
fi

echo "→ Iniciando $APP con pm2…"
pm2 start npm --name "$APP" -- run preview
pm2 save

echo
echo "✓ Dashboard activo en http://127.0.0.1:$PORT"
echo
echo "Para que arranque al prender la Mac:"
echo "  pm2 startup    # te mostrará un comando con sudo, cópialo y ejecútalo"
echo
echo "Comandos útiles:"
echo "  pm2 logs $APP          # ver logs"
echo "  pm2 restart $APP       # reiniciar"
echo "  pm2 stop $APP         # detener"
echo "  pm2 status            # procesos activos"