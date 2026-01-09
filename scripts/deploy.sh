#!/bin/bash

# Скрипт деплоя для выполнения на сервере
# Используется Jenkins для автоматического деплоя

set -e  # Остановка при ошибке

DEPLOY_PATH="${DEPLOY_PATH:-/opt/personal-page}"
BRANCH="${BRANCH:-main}"

echo "🚀 Начало деплоя..."
echo "📂 Директория: $DEPLOY_PATH"
echo "🌿 Ветка: $BRANCH"
echo ""

# Переход в директорию проекта
cd "$DEPLOY_PATH" || {
    echo "❌ Ошибка: директория $DEPLOY_PATH не найдена"
    exit 1
}

# Обновление кода из репозитория
echo "🔄 Обновление кода из репозитория..."
git fetch origin
git reset --hard "origin/$BRANCH" || git reset --hard "origin/master" || {
    echo "❌ Ошибка: не удалось обновить код"
    exit 1
}
echo "✅ Код обновлен"

# Настройка окружения
echo ""
echo "🔧 Настройка окружения..."
if [ -f env.prod ]; then
    cp env.prod .env
    echo "✅ env.prod скопирован в .env"
elif [ -f env.local ]; then
    cp env.local .env
    echo "✅ env.local скопирован в .env"
else
    echo "⚠️  env.prod и env.local не найдены, используем существующий .env"
fi

# Остановка старых контейнеров
echo ""
echo "🐳 Остановка старых контейнеров..."
if command -v docker-compose &> /dev/null; then
    docker-compose down || true
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    docker compose down || true
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Ошибка: Docker Compose не найден"
    exit 1
fi

# Сборка и запуск новых контейнеров
echo ""
echo "🔨 Сборка и запуск новых контейнеров..."
$DOCKER_COMPOSE_CMD up -d --build || {
    echo "❌ Ошибка при сборке/запуске контейнеров"
    exit 1
}

# Ожидание запуска сервисов
echo ""
echo "⏳ Ожидание запуска сервисов..."
sleep 5

# Запуск миграций базы данных
echo ""
echo "🗄️  Запуск миграций базы данных..."
$DOCKER_COMPOSE_CMD exec -T backend npm run migrate || echo "⚠️  Миграция уже выполнена или контейнер еще не готов"

# Проверка статуса контейнеров
echo ""
echo "📊 Проверка статуса контейнеров..."
$DOCKER_COMPOSE_CMD ps

# Проверка здоровья сервисов
echo ""
echo "🏥 Проверка здоровья сервисов..."
sleep 3

# Проверка backend health endpoint
if curl -f http://localhost:9000/health > /dev/null 2>&1; then
    echo "✅ Backend health check: OK"
    curl -s http://localhost:9000/health | head -5
else
    echo "❌ Backend health check: FAILED"
    echo "📋 Логи backend:"
    $DOCKER_COMPOSE_CMD logs --tail=50 backend
    exit 1
fi

# Проверка, что контейнеры запущены
if ! $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    echo "❌ Не все контейнеры запущены"
    $DOCKER_COMPOSE_CMD ps
    exit 1
fi

echo ""
echo "✅ Деплой завершен успешно!"
echo "🌐 Frontend: http://$(hostname -I | awk '{print $1}'):8888"
echo "🔌 Backend API: http://$(hostname -I | awk '{print $1}'):9000"

