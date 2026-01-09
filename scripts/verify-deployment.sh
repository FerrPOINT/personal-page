#!/bin/bash

# Скрипт для проверки корректности деплоя и работы всех компонентов

set -e

echo "🔍 Проверка деплоя и конфигурации..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# Функция для предупреждения
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Проверка версии deploy.sh
echo "📋 1. Проверка версии deploy.sh..."
if grep -q "contains_placeholders" scripts/deploy.sh 2>/dev/null; then
    check "deploy.sh содержит функцию contains_placeholders (новая версия)"
else
    warn "deploy.sh не содержит contains_placeholders (возможно старая версия)"
fi

# 2. Проверка Jenkinsfile
echo ""
echo "📋 2. Проверка Jenkinsfile..."
if grep -q "7eb10d5af2ad.vps.myjino.ru" Jenkinsfile 2>/dev/null; then
    check "Jenkinsfile использует реальный хост"
else
    warn "Jenkinsfile может использовать алиас (проверь DEPLOY_HOST)"
fi

if grep -q "try {" Jenkinsfile 2>/dev/null; then
    check "Jenkinsfile обрабатывает опциональные credentials через try-catch"
else
    warn "Jenkinsfile может не обрабатывать опциональные credentials"
fi

# 3. Проверка env.prod
echo ""
echo "📋 3. Проверка env.prod..."
if grep -q "your_bot_token_here\|your_user_id_here" env.prod 2>/dev/null; then
    check "env.prod содержит placeholder значения (правильно для репозитория)"
else
    warn "env.prod может содержать реальные секреты (не должно быть в репозитории!)"
fi

if ! grep -q "^VITE_API_URL=" env.prod 2>/dev/null; then
    check "VITE_API_URL отсутствует в env.prod (правильно - используется относительный путь)"
else
    warn "VITE_API_URL присутствует в env.prod (может быть не нужно)"
fi

# 4. Проверка .gitignore
echo ""
echo "📋 4. Проверка .gitignore..."
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    check ".env в .gitignore (секреты не попадут в репозиторий)"
else
    warn ".env не в .gitignore (риск попадания секретов в репозиторий!)"
fi

if grep -q "^\.cursor" .gitignore 2>/dev/null; then
    check ".cursor в .gitignore"
else
    warn ".cursor не в .gitignore"
fi

# 5. Проверка структуры проекта
echo ""
echo "📋 5. Проверка структуры проекта..."
[ -f "scripts/deploy.sh" ] && check "scripts/deploy.sh существует" || warn "scripts/deploy.sh не найден"
[ -f "Jenkinsfile" ] && check "Jenkinsfile существует" || warn "Jenkinsfile не найден"
[ -f "docker-compose.yml" ] && check "docker-compose.yml существует" || warn "docker-compose.yml не найден"
[ -f "frontend/nginx.conf" ] && check "frontend/nginx.conf существует" || warn "frontend/nginx.conf не найден"

# 6. Проверка nginx.conf
echo ""
echo "📋 6. Проверка nginx.conf..."
if grep -q "location /api" frontend/nginx.conf 2>/dev/null; then
    check "nginx.conf содержит проксирование /api"
    if grep -q "proxy_pass http://backend:9000/api" frontend/nginx.conf 2>/dev/null; then
        check "nginx.conf правильно проксирует на backend:9000/api"
    else
        warn "nginx.conf может неправильно проксировать /api"
    fi
else
    warn "nginx.conf не содержит проксирование /api"
fi

# 7. Проверка docker-compose.yml
echo ""
echo "📋 7. Проверка docker-compose.yml..."
if grep -q "env_file:" docker-compose.yml 2>/dev/null; then
    check "docker-compose.yml использует env_file"
else
    warn "docker-compose.yml может не использовать env_file"
fi

# Итоговый отчет
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Итоговый отчет:"
echo ""
echo "💡 Для проверки на сервере выполни:"
echo "   ssh -i ~/.ssh/id_rsa root@azhukov-dev"
echo "   cd /opt/personal-page"
echo "   bash scripts/verify-deployment.sh"
echo ""
echo "💡 Для проверки через Jenkins:"
echo "   curl -u ferrpoint:TOKEN 'http://192.168.1.49:32768/job/personal-page-deploy/lastBuild/api/json?tree=result'"
echo ""
echo "✅ Проверка завершена!"

