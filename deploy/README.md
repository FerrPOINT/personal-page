# Ручной выпуск personal-page

Production-схема: `azhukov-dev.ru → Shkurtz Nginx/TLS → reverse SSH → Firebat1 → Docker Compose`.
Shkurtz принимает только сайт и `POST /api/contact`. Контейнеры на Firebat1 слушают только loopback.

## Один раз на хостах

1. На Shkurtz установить [nginx.conf](./shkurtz/nginx.conf), проверить `nginx -t` и перезагрузить Nginx.
2. Создать отдельного SSH-пользователя `tunnel` без shell-доступа и разрешить ему только remote forwarding на `127.0.0.1:18888` и `127.0.0.1:19000`.
3. На Firebat1 установить [personal-page-tunnel.service](./firebat1/personal-page-tunnel.service). Закрытый ключ хранить в `/etc/personal-page/shkurtz_ed25519`, host key — в `/etc/personal-page/known_hosts`, параметры — в `/etc/personal-page/tunnel.env` с правами `0600`.
4. В `/opt/personal-page/.env` задать только runtime-переменные из `.env.example`. Файл не добавлять в Git.

## Локальная проверка и сборка

```bash
git status --short
cd backend && npm ci && npm run build && npm test && npm audit --omit=dev
cd ../frontend && npm ci && npm run build && npm run test:run && npm audit --omit=dev
cd ..
IMAGE_TAG=$(git rev-parse HEAD) docker compose config >/dev/null
IMAGE_TAG=$(git rev-parse HEAD) docker compose build --pull
docker image inspect personal-page-frontend:$(git rev-parse HEAD) --format '{{.Id}}'
docker image inspect personal-page-backend:$(git rev-parse HEAD) --format '{{.Id}}'
```

Сборка выполняется для `linux/amd64`. Если локальный Docker работает на другой архитектуре:

```bash
docker buildx build --platform linux/amd64 --load -t personal-page-frontend:$(git rev-parse HEAD) frontend
docker buildx build --platform linux/amd64 --load -t personal-page-backend:$(git rev-parse HEAD) backend
```

## Передача и переключение Firebat1

Firebat1 не собирает образы и не обращается к registry.

```bash
SHA=$(git rev-parse HEAD)
docker save personal-page-frontend:$SHA personal-page-backend:$SHA | gzip > personal-page-$SHA.tar.gz
scp personal-page-$SHA.tar.gz firebat1:/opt/personal-page/releases/
scp docker-compose.yml firebat1:/opt/personal-page/docker-compose.yml

ssh firebat1
cd /opt/personal-page
gunzip -c releases/personal-page-$SHA.tar.gz | docker load
IMAGE_TAG=$SHA docker compose run --rm --no-deps backend node dist/db/migrate.js
printf 'IMAGE_TAG=%s\n' "$SHA" > .release.env
docker compose --env-file .release.env up -d --no-build
docker compose --env-file .release.env ps
docker compose --env-file .release.env images
curl -fsS http://127.0.0.1:9000/ready
curl -fsS http://127.0.0.1:8888/ >/dev/null
```

## Public smoke и readback

```bash
curl -fsS https://azhukov-dev.ru/ >/dev/null
curl -i https://azhukov-dev.ru/live              # ожидается 404
curl -i https://azhukov-dev.ru/ready             # ожидается 404
curl -i https://azhukov-dev.ru/api/unknown       # ожидается 404
curl -i -X POST https://azhukov-dev.ru/api/contact \
  -H 'content-type: application/json' \
  --data '{"name":"Release canary","email":"canary@example.com","message":"Canary: <commit SHA>"}'
```

Ожидаемый ответ формы — `202` со статусом `pending`. Проверить одно canary-сообщение в Telegram, затем записать точные значения:

```bash
docker compose --env-file .release.env ps -q frontend | xargs docker inspect --format '{{.Image}} {{.Config.Image}}'
docker compose --env-file .release.env ps -q backend | xargs docker inspect --format '{{.Image}} {{.Config.Image}}'
openssl s_client -connect azhukov-dev.ru:443 -servername azhukov-dev.ru </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

## Очередь и ручной replay

```bash
docker compose --env-file .release.env exec backend node dist/src/cli/list-queue.js 20
docker compose --env-file .release.env exec backend node dist/src/cli/replay-message.js <dead-message-id>
```

Сообщения не удаляются автоматически. Регулярные копии базы не создаются.

## Rollback

Указать предыдущий проверенный SHA и переключить Compose без сборки:

```bash
PREVIOUS_SHA=<previous-full-commit-sha>
printf 'IMAGE_TAG=%s\n' "$PREVIOUS_SHA" > .release.env
docker compose --env-file .release.env up -d --no-build
docker compose --env-file .release.env ps
```

После rollback повторить public smoke и readback image ID.
