# Deploy (Docker, Linux)

Tək konteyner: **nginx** → `dist/` (SPA) + `/api/` → backend reverse-proxy.
Vite build image içində gedir, serverdə Node lazım deyil.

## 1. Server hazırlığı (bir dəfə)

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
docker compose version
```

## 2. Layihəni serverə çıxar

```bash
git clone <repo-url> azericard && cd azericard
cp .env.example .env
nano .env        # API_UPSTREAM, HOST_PORT, VITE_PERSIST_KEY
```

`.env` dəyişənləri:

| Dəyişən            | Nə edir                                              | Default                      |
|--------------------|------------------------------------------------------|------------------------------|
| `API_UPSTREAM`     | nginx `/api/` sorğularını bura yönləndirir (runtime) | `http://31.57.77.199:8080`   |
| `HOST_PORT`        | Serverdə açılan port                                 | `80`                         |
| `SERVER_NAME`      | nginx `server_name`                                  | `_` (hamısı)                 |
| `VITE_APP_API`     | Bundle-a yazılan API base (build-time)               | `/api/` — dəyişmə            |
| `VITE_PERSIST_KEY` | redux-persist şifrə açarı (build-time)               | dəyiş                        |

## 3. Qaldır

```bash
./deploy.sh
```

və ya əl ilə:

```bash
docker compose build --pull
docker compose up -d
```

Yoxla: `curl -s http://localhost/healthz` → `ok`

## 4. Yeniləmə

```bash
git pull && ./deploy.sh
```

## Faydalı əmrlər

```bash
docker compose ps                 # status + health
docker compose logs -f web        # nginx log
docker compose restart web
docker compose down               # dayandır
```

## Backend ünvanı dəyişəndə

Yalnız `.env`-də `API_UPSTREAM` dəyiş və `docker compose up -d` — rebuild lazım deyil
(`VITE_APP_API=/api/` olduğu üçün brauzer həmişə eyni origin-ə gedir, nginx yönləndirir).

## HTTPS (istəyə görə)

Ən sadə yol: serverdə ayrıca [Caddy](https://caddyserver.com) və ya `nginx-proxy` + `acme-companion`
qoyub `HOST_PORT`-u `8080` kimi daxili porta çəkmək. `X-Forwarded-Proto` artıq ötürülür.

## Fayllar

- `Dockerfile` — 2 mərhələ: `node:22-alpine` build → `nginx:1.27-alpine` runtime (~83 MB)
- `docker/nginx.conf.template` — SPA fallback, `/api/` proxy, gzip, cache, `/healthz`
- `docker-compose.yml` — port, env, healthcheck, log rotation
- `.dockerignore`, `.env.example`, `deploy.sh`
