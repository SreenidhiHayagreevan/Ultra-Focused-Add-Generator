#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
FRONTEND_CONFIG="$FRONTEND_DIR/config.js"

BACKEND_PORT=5050
FRONTEND_PORT=3000
API_BASE="http://localhost:${BACKEND_PORT}"

BACKEND_LOG="/tmp/trendhijack_backend.log"
FRONTEND_LOG="/tmp/trendhijack_frontend.log"
CONFIG_BACKUP="/tmp/trendhijack_config.js.bak"

cleanup() {
  if [[ -f "$CONFIG_BACKUP" ]]; then
    cp "$CONFIG_BACKUP" "$FRONTEND_CONFIG"
    rm -f "$CONFIG_BACKUP"
  fi
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

cp "$FRONTEND_CONFIG" "$CONFIG_BACKUP"
printf 'window.__API_BASE__ = "%s";\n' "$API_BASE" > "$FRONTEND_CONFIG"

cd "$BACKEND_DIR"
SMOKE_MODE=1 PORT="$BACKEND_PORT" FLASK_ENV=development python3 app.py >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS "$API_BASE/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

cd "$FRONTEND_DIR"
python3 -m http.server "$FRONTEND_PORT" --bind 0.0.0.0 >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

echo "TrendHijack local smoke environment started"
echo "Backend:  $API_BASE"
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo

echo "Health check:"
curl -s "$API_BASE/api/health"
echo

echo "Press Ctrl+C to stop both servers"
wait
