#!/bin/bash

# Скрипт для проверки на сервере (выполняется на сервере деплоя)

set -e

echo "🔍 Проверка сервера деплоя..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Проверка версии кода
echo "📋 1. Проверка версии кода..."
LATEST_COMMIT=$(git log --oneline -1)
echo "   Последний commit: $LATEST_COMMIT"

if git log --oneline | grep -q "fix: исправлена обработка опциональных credentials"; then
    check "Новая версия Jenkinsfile установлена"
else
    warn "Возможно старая версия Jenkinsfile"
fi

# 2. Проверка deploy.sh
echo ""
echo "📋 2. Проверка deploy.sh..."
if grep -q "contains_placeholders" scripts/deploy.sh 2>/dev/null; then
    check "deploy.sh содержит функцию contains_placeholders (новая версия)"
else
    warn "deploy.sh не содержит contains_placeholders (старая версия)"
fi

# 3. Проверка .env
echo ""
echo "📋 3. Проверка .env..."
if [ -f .env ]; then
    check ".env файл существует"
    
    if grep -q "your_bot_token_here\|your_user_id_here" .env 2>/dev/null; then
        warn ".env содержит placeholder значения (нужно обновить реальными)"
    else
        check ".env содержит реальные значения (не placeholder)"
    fi
    
    if grep -q "^FRONTEND_URL=" .env 2>/dev/null; then
        FRONTEND_URL=$(grep "^FRONTEND_URL=" .env | cut -d'=' -f2)
        check "FRONTEND_URL установлен: $FRONTEND_URL"
    else
        warn "FRONTEND_URL не установлен в .env"
    fi
    
    if ! grep -q "^VITE_API_URL=" .env 2>/dev/null; then
        check "VITE_API_URL отсутствует (правильно - используется относительный путь)"
    else
        VITE_API_URL=$(grep "^VITE_API_URL=" .env | cut -d'=' -f2)
        if [[ "$VITE_API_URL" == *"localhost"* ]]; then
            warn "VITE_API_URL указывает на localhost: $VITE_API_URL (может быть неправильно)"
        fi
    fi
else
    warn ".env файл не найден"
fi

# 4. Проверка Docker контейнеров
echo ""
echo "📋 4. Проверка Docker контейнеров..."
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
    check "Docker Compose установлен"
    
    if docker compose ps 2>/dev/null | grep -q "Up"; then
        check "Контейнеры запущены"
        docker compose ps --format "table {{.Name}}\t{{.Status}}"
    else
        warn "Контейнеры не запущены"
    fi
else
    warn "Docker Compose не найден"
fi

# 5. Проверка Backend
echo ""
echo "📋 5. Проверка Backend..."
if curl -f -s http://localhost:9000/health > /dev/null 2>&1; then
    check "Backend health check: OK"
    curl -s http://localhost:9000/health | head -1
else
    warn "Backend health check: FAILED"
fi

# 6. Проверка Frontend
echo ""
echo "📋 6. Проверка Frontend..."
if curl -f -s http://localhost:8888/ > /dev/null 2>&1; then
    check "Frontend доступен"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/)
    echo "   HTTP код: $HTTP_CODE"
else
    warn "Frontend недоступен"
fi

# 7. Проверка API через проксирование
echo ""
echo "📋 7. Проверка API через проксирование..."
API_RESPONSE=$(curl -s -X POST http://localhost:8888/api/contact \
    -H 'Content-Type: application/json' \
    -d '{"name":"Test","email":"test@test.com","message":"Test"}' 2>&1)

if echo "$API_RESPONSE" | grep -q '"success":true'; then
    check "API /api/contact работает через проксирование"
else
    warn "API /api/contact не работает: $API_RESPONSE"
fi

# 8. Проверка nginx конфигурации
echo ""
echo "📋 8. Проверка nginx конфигурации..."
if docker compose exec -T frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -q "location /api"; then
    check "nginx содержит проксирование /api"
    
    if docker compose exec -T frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -q "proxy_pass http://backend:9000/api"; then
        check "nginx правильно проксирует на backend:9000/api"
    else
        warn "nginx может неправильно проксировать /api"
    fi
else
    warn "nginx не содержит проксирование /api"
fi

# 9. Проверка Telegram бота (если настроен)
echo ""
echo "📋 9. Проверка Telegram бота..."
if [ -f .env ] && grep -q "^TELEGRAM_BOT_TOKEN=" .env 2>/dev/null; then
    TELEGRAM_TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" .env | cut -d'=' -f2)
    if [[ "$TELEGRAM_TOKEN" == *"your_bot_token_here"* ]] || [ -z "$TELEGRAM_TOKEN" ]; then
        warn "TELEGRAM_BOT_TOKEN не настроен (placeholder)"
    else
        check "TELEGRAM_BOT_TOKEN установлен"
        
        # Проверка логов на ошибки Telegram
        if docker compose logs backend 2>/dev/null | grep -q "ETELEGRAM: 404"; then
            warn "В логах есть ошибки Telegram (ETELEGRAM: 404)"
        else
            check "Ошибок Telegram в логах не найдено"
        fi
    fi
else
    warn "TELEGRAM_BOT_TOKEN не найден в .env"
fi

# Итоговый отчет
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Итоговый отчет:"
echo ""
echo "💡 Если есть проблемы:"
echo "   1. Проверь логи: docker compose logs backend"
echo "   2. Проверь .env: cat .env | grep TELEGRAM"
echo "   3. Перезапусти: docker compose restart backend"
echo ""
echo "✅ Проверка завершена!"

