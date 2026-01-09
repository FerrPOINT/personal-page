#!/bin/bash

# Автоматическая настройка сервера деплоя

SERVER="7eb10d5af2ad.vps.myjino.ru"
PORT="49233"
SSH_KEY="${1:-$HOME/.ssh/id_ed25519}"
DEPLOY_PATH="/opt/personal-page"
REPO_URL="https://github.com/FerrPOINT/personal-page.git"

echo "🚀 Автоматическая настройка сервера деплоя"
echo "=========================================="
echo ""

# Проверка подключения
echo "1️⃣ Проверка SSH подключения..."
if ssh -i "$SSH_KEY" -p "$PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$SERVER" "echo '✅ Подключение работает'" 2>/dev/null; then
    echo "   ✅ SSH подключение работает"
else
    echo "   ❌ Не удалось подключиться к серверу"
    echo "   💡 Проверьте SSH ключ и доступность сервера"
    exit 1
fi

echo ""
echo "2️⃣ Проверка установленного ПО..."

ssh -i "$SSH_KEY" -p "$PORT" root@"$SERVER" "
    echo '   Docker:' \$(docker --version 2>/dev/null || echo '❌ не установлен')
    echo '   Docker Compose:' \$(docker compose version 2>/dev/null || echo '❌ не установлен')
    echo '   Git:' \$(git --version 2>/dev/null || echo '❌ не установлен')
"

echo ""
echo "3️⃣ Настройка директории проекта..."

ssh -i "$SSH_KEY" -p "$PORT" root@"$SERVER" "
    if [ ! -d $DEPLOY_PATH ]; then
        echo '   📂 Создание директории...'
        mkdir -p $DEPLOY_PATH
    fi
    
    cd $DEPLOY_PATH
    
    if [ ! -d .git ]; then
        echo '   📥 Клонирование репозитория...'
        git clone $REPO_URL .
    else
        echo '   🔄 Репозиторий уже существует, обновление...'
        git fetch origin
        git checkout -f origin/main || git checkout -f origin/master
    fi
    
    echo '   ✅ Репозиторий готов'
    
    if [ ! -f env.prod ]; then
        echo '   ⚠️  env.prod не найден'
        if [ -f env.example.txt ]; then
            echo '   📝 Создание env.prod из env.example.txt...'
            cp env.example.txt env.prod
            echo '   ✅ env.prod создан (нужно заполнить значения)'
        fi
    else
        echo '   ✅ env.prod существует'
    fi
    
    echo '   🔧 Установка прав на скрипты...'
    chmod +x scripts/*.sh 2>/dev/null || true
    echo '   ✅ Права установлены'
"

echo ""
echo "4️⃣ Проверка готовности..."

ssh -i "$SSH_KEY" -p "$PORT" root@"$SERVER" "
    cd $DEPLOY_PATH
    echo '   📋 Файлы в проекте:'
    ls -la | head -10
    echo ''
    echo '   📋 Git статус:'
    git remote -v
    git branch
"

echo ""
echo "✅ Сервер настроен!"
echo ""
echo "💡 Следующие шаги:"
echo "   1. Заполните env.prod на сервере (если нужно)"
echo "   2. Запустите тестовый build в Jenkins"

