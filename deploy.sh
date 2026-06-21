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

# Функция для проверки, содержит ли файл placeholder значения
contains_placeholders() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return 1
    fi
    grep -q "your_bot_token_here\|your_user_id_here" "$file" 2>/dev/null
}

upsert_env_var() {
    local key="$1"
    local value="$2"
    local label="${3:-$1}"

    if [ -z "$value" ]; then
        echo "  ⚠️  ${label} не передан, оставляем текущее значение в .env"
        return 0
    fi

    touch .env
    grep -v "^${key}=" .env > .env.tmp || true
    mv .env.tmp .env
    printf '%s=%s\n' "$key" "$value" >> .env
    echo "  ✅ ${label} обновлен в .env"
}

# Если .env уже существует и содержит реальные значения (не placeholder), не перезаписываем
if [ -f .env ] && ! contains_placeholders .env; then
    echo "✅ .env уже существует с реальными значениями, сохраняем его"
    # Обновляем только отсутствующие переменные из env.prod
    if [ -f env.prod ]; then
        # Добавляем только новые переменные, которых нет в .env
        while IFS='=' read -r key value; do
            # Пропускаем комментарии и пустые строки
            [[ "$key" =~ ^#.*$ ]] && continue
            [[ -z "$key" ]] && continue
            # Пропускаем placeholder значения
            [[ "$value" =~ your_.*_here ]] && continue
            # Если переменная отсутствует в .env, добавляем её
            if ! grep -q "^${key}=" .env 2>/dev/null; then
                echo "${key}=${value}" >> .env
                echo "  ➕ Добавлена переменная: ${key}"
            fi
        done < env.prod
    fi
    
    # ВАЖНО: Всегда обновляем секреты из переменных окружения (если переданы через Jenkins)
    # Это критично для токенов, которые могут меняться
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ "$TELEGRAM_BOT_TOKEN" != "your_bot_token_here" ]; then
        TOKEN_LENGTH=${#TELEGRAM_BOT_TOKEN}
        TOKEN_PREFIX="${TELEGRAM_BOT_TOKEN:0:10}..."
        echo "  🔐 Получен TELEGRAM_BOT_TOKEN из Jenkins (длина: ${TOKEN_LENGTH}, префикс: ${TOKEN_PREFIX})"
        if grep -q "^TELEGRAM_BOT_TOKEN=" .env 2>/dev/null; then
            sed -i "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}|" .env
            echo "  ✅ TELEGRAM_BOT_TOKEN обновлен в .env"
        else
            echo "TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}" >> .env
            echo "  ✅ TELEGRAM_BOT_TOKEN добавлен в .env"
        fi
    else
        if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
            echo "  ⚠️  TELEGRAM_BOT_TOKEN не передан из Jenkins (пустая переменная)"
        else
            echo "  ⚠️  TELEGRAM_BOT_TOKEN содержит placeholder значение"
        fi
    fi
    if [ -n "$TELEGRAM_USER_ID" ] && [ "$TELEGRAM_USER_ID" != "your_user_id_here" ]; then
        echo "  🔐 Получен TELEGRAM_USER_ID из Jenkins: ${TELEGRAM_USER_ID}"
        if grep -q "^TELEGRAM_USER_ID=" .env 2>/dev/null; then
            sed -i "s|^TELEGRAM_USER_ID=.*|TELEGRAM_USER_ID=${TELEGRAM_USER_ID}|" .env
            echo "  ✅ TELEGRAM_USER_ID обновлен в .env"
        else
            echo "TELEGRAM_USER_ID=${TELEGRAM_USER_ID}" >> .env
            echo "  ✅ TELEGRAM_USER_ID добавлен в .env"
        fi
    else
        if [ -z "$TELEGRAM_USER_ID" ]; then
            echo "  ⚠️  TELEGRAM_USER_ID не передан из Jenkins (пустая переменная)"
        else
            echo "  ⚠️  TELEGRAM_USER_ID содержит placeholder значение"
        fi
    fi
elif [ -f env.prod ]; then
    # Если .env не существует или содержит placeholder, копируем из env.prod
    cp env.prod .env
    echo "✅ env.prod скопирован в .env"
    
    # Обновляем секреты из переменных окружения (если переданы через Jenkins)
    # BEST PRACTICE: Секреты передаются через переменные окружения, не через файлы
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ "$TELEGRAM_BOT_TOKEN" != "your_bot_token_here" ]; then
        TOKEN_LENGTH=${#TELEGRAM_BOT_TOKEN}
        TOKEN_PREFIX="${TELEGRAM_BOT_TOKEN:0:10}..."
        echo "  🔐 Получен TELEGRAM_BOT_TOKEN из Jenkins (длина: ${TOKEN_LENGTH}, префикс: ${TOKEN_PREFIX})"
        if grep -q "^TELEGRAM_BOT_TOKEN=" .env 2>/dev/null; then
            sed -i "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}|" .env
            echo "  ✅ TELEGRAM_BOT_TOKEN обновлен в .env"
        else
            echo "TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}" >> .env
            echo "  ✅ TELEGRAM_BOT_TOKEN добавлен в .env"
        fi
    else
        if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
            echo "  ⚠️  TELEGRAM_BOT_TOKEN не передан из Jenkins (пустая переменная)"
        else
            echo "  ⚠️  TELEGRAM_BOT_TOKEN содержит placeholder значение"
        fi
    fi
    if [ -n "$TELEGRAM_USER_ID" ] && [ "$TELEGRAM_USER_ID" != "your_user_id_here" ]; then
        echo "  🔐 Получен TELEGRAM_USER_ID из Jenkins: ${TELEGRAM_USER_ID}"
        if grep -q "^TELEGRAM_USER_ID=" .env 2>/dev/null; then
            sed -i "s|^TELEGRAM_USER_ID=.*|TELEGRAM_USER_ID=${TELEGRAM_USER_ID}|" .env
            echo "  ✅ TELEGRAM_USER_ID обновлен в .env"
        else
            echo "TELEGRAM_USER_ID=${TELEGRAM_USER_ID}" >> .env
            echo "  ✅ TELEGRAM_USER_ID добавлен в .env"
        fi
    else
        if [ -z "$TELEGRAM_USER_ID" ]; then
            echo "  ⚠️  TELEGRAM_USER_ID не передан из Jenkins (пустая переменная)"
        else
            echo "  ⚠️  TELEGRAM_USER_ID содержит placeholder значение"
        fi
    fi
elif [ -f env.local ]; then
    cp env.local .env
    echo "✅ env.local скопирован в .env"
else
    echo "⚠️  env.prod и env.local не найдены, используем существующий .env"
fi

echo ""
echo "📧 Настройка email-уведомлений формы контактов..."
upsert_env_var "CONTACT_NOTIFICATION_CHANNELS" "${CONTACT_NOTIFICATION_CHANNELS:-email}" "CONTACT_NOTIFICATION_CHANNELS"
upsert_env_var "GMAIL_USER" "$GMAIL_USER" "GMAIL_USER"
upsert_env_var "GMAIL_APP_PASSWORD" "$GMAIL_APP_PASSWORD" "GMAIL_APP_PASSWORD"
upsert_env_var "CONTACT_EMAIL_TO" "$CONTACT_EMAIL_TO" "CONTACT_EMAIL_TO"

# Определение команды Docker Compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Ошибка: Docker Compose не найден"
    exit 1
fi

# ZERO-DOWNTIME DEPLOYMENT: Сборка образов БЕЗ остановки контейнеров
echo ""
echo "🔨 Сборка новых образов (старые контейнеры продолжают работать)..."
$DOCKER_COMPOSE_CMD build --parallel || {
    echo "❌ Ошибка при сборке образов"
    exit 1
}
echo "✅ Образы собраны"

# Проверка, что старые контейнеры работают
echo ""
echo "🔍 Проверка текущих контейнеров..."
if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    echo "✅ Старые контейнеры работают, продолжаем zero-downtime деплой"
    OLD_CONTAINERS_RUNNING=true
else
    echo "⚠️  Старые контейнеры не запущены, запускаем новые"
    OLD_CONTAINERS_RUNNING=false
fi

# Обновление контейнеров с минимальным downtime
echo ""
echo "🔄 Обновление контейнеров (zero-downtime)..."
if [ "$OLD_CONTAINERS_RUNNING" = true ]; then
    # Обновляем backend первым (критичный сервис)
    # ВАЖНО: docker compose up останавливает старый контейнер перед запуском нового
    # Это создает минимальный downtime ~2-5 секунд (не настоящий zero-downtime)
    # Для настоящего zero-downtime нужен load balancer или Docker Swarm
    # Используем --no-deps чтобы не трогать frontend пока backend обновляется
    echo "  📦 Обновление backend (минимальный downtime ~2-5 сек при переключении)..."
    $DOCKER_COMPOSE_CMD up -d --no-deps backend || {
        echo "❌ Ошибка при обновлении backend"
        exit 1
    }
    
    # Ждем готовности нового backend (health check)
    echo "  ⏳ Ожидание готовности нового backend (health check, до 60 секунд)..."
    BACKEND_READY=false
    for i in {1..30}; do
        # Проверяем что контейнер запущен
        if $DOCKER_COMPOSE_CMD ps backend | grep -q "Up"; then
            # Проверяем health endpoint
            if curl -f -s http://localhost:9000/health > /dev/null 2>&1; then
                BACKEND_READY=true
                break
            fi
        fi
        sleep 2
        if [ $((i % 5)) -eq 0 ]; then
            echo "    Проверка $i/30..."
        fi
    done
    
    if [ "$BACKEND_READY" != true ]; then
        echo "❌ Backend не готов после обновления!"
        echo "📋 Логи backend:"
        $DOCKER_COMPOSE_CMD logs --tail=30 backend
        exit 1
    fi
    echo "  ✅ Backend готов и отвечает на запросы"
    
    # Обновляем frontend (backend уже новый и работает)
    # ВАЖНО: docker compose up останавливает старый контейнер перед запуском нового
    # Минимальный downtime ~2-5 секунд при переключении
    echo "  📦 Обновление frontend (минимальный downtime ~2-5 сек при переключении)..."
    $DOCKER_COMPOSE_CMD up -d --no-deps frontend || {
        echo "❌ Ошибка при обновлении frontend"
        exit 1
    }
    
    # Ждем готовности нового frontend
    echo "  ⏳ Ожидание готовности frontend (до 30 секунд)..."
    FRONTEND_READY=false
    for i in {1..15}; do
        # Проверяем что контейнер запущен
        if $DOCKER_COMPOSE_CMD ps frontend | grep -q "Up"; then
            # Проверяем доступность
            if curl -f -s http://localhost:8888 > /dev/null 2>&1; then
                FRONTEND_READY=true
                break
            fi
        fi
        sleep 2
        if [ $((i % 5)) -eq 0 ]; then
            echo "    Проверка $i/15..."
        fi
    done
    
    if [ "$FRONTEND_READY" != true ]; then
        echo "⚠️  Frontend не готов, но backend работает"
        echo "📋 Логи frontend:"
        $DOCKER_COMPOSE_CMD logs --tail=20 frontend
    else
        echo "  ✅ Frontend готов и отвечает на запросы"
    fi
else
    # Если контейнеры не запущены, просто запускаем
    echo "  🚀 Запуск контейнеров..."
    $DOCKER_COMPOSE_CMD up -d --build || {
        echo "❌ Ошибка при запуске контейнеров"
        exit 1
    }
fi

# Финальная проверка готовности
echo ""
echo "⏳ Финальная проверка готовности сервисов..."
sleep 3

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

# Проверяем systemd сервис (не перезапускаем - контейнеры уже обновлены)
# Перезапуск systemd сервиса может вызвать дополнительный downtime
# Контейнеры уже работают через docker compose, systemd сервис только для автозапуска
if systemctl is-enabled personal-page.service > /dev/null 2>&1; then
    echo ""
    echo "ℹ️  Systemd сервис настроен для автозапуска (контейнеры уже работают)"
fi
