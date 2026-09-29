#!/usr/bin/env bash
# Build the dashboard and restart the pm2 process so master is live.
#
# Safe to run repeatedly. If pm2 is not installed, prints instructions and
# leaves a build behind so `npm run setup` can pick up later.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT=7777
APP="s4f-admin"

echo "→ Instalando dependencias…"
npm ci --silent || npm install --silent

echo "→ Compilando (vite build)…"
npm run build

if ! command -v pm2 >/dev/null 2>&1; then
  echo
  echo "pm2 no está instalado. Para activar el deploy:"
  echo "  bash scripts/setup.sh"
  echo
  echo "El build quedó en dist/. Puedes abrirlo con: npm run preview"
  exit 0
fi

if pm2 describe "$APP" >/dev/null 2>&1; then
  echo "→ Reiniciando proceso pm2: $APP"
  pm2 restart "$APP"
else
  echo "→ Iniciando proceso pm2: $APP"
  pm2 start npm --name "$APP" -- run preview
fi

pm2 save >/dev/null

echo
echo "✓ Desplegado en http://127.0.0.1:$PORT"
pm2 status "$APP"