#!/usr/bin/env bash
# One-shot deploy/update on a Linux server:  ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { cp .env.example .env; echo ">> .env created from .env.example — edit it, then re-run."; exit 1; }

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

echo ">> building image"
$DC build --pull
echo ">> starting"
$DC up -d --remove-orphans
echo ">> pruning old images"
docker image prune -f >/dev/null
echo
$DC ps
echo
echo "Done. App: http://$(hostname -I 2>/dev/null | awk '{print $1}'):$(grep -E '^HOST_PORT=' .env | cut -d= -f2 || echo 80)"
