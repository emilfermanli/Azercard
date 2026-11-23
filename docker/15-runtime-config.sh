#!/bin/sh
set -eu

raw="${CACHE_ENABLED:-true}"
norm="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"

case "$norm" in
  false|0|off|no)
    enabled="false"
    ;;
  *)
    enabled="true"
    ;;
esac

cat <<EOF > /usr/share/nginx/html/runtime-config.js
window.__APP_CONFIG__ = Object.freeze({ cacheEnabled: ${enabled} });
EOF

echo "[azericard-web] runtime-config.js generated: CACHE_ENABLED=${enabled}"
