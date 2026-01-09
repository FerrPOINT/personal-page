#!/bin/bash

# Скрипт для проверки и настройки сервера деплоя

SERVER="azhukov-dev"
SSH_KEY="${1:-$HOME/.ssh/id_rsa}"
DEPLOY_PATH="/opt/personal-page"

echo "🔍 Проверка сервера деплоя: $SERVER"
echo ""

# Проверка подключения
echo "1️⃣ Проверка SSH подключения..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=5 root@"$SERVER" "echo '✅ Подключение работает'" 2>/dev/null; then
    echo "   ✅ SSH подключение работает"
else
    echo "   ❌ Не удалось подключиться к серверу"
    exit 1
fi

echo ""
echo "2️⃣ Проверка установленного ПО..."

ssh -i "$SSH_KEY" root@"$SERVER" "
    echo '   Docker:' \$(docker --version 2>/dev/null || echo '❌ не установлен')
    echo '   Docker Compose:' \$(docker compose version 2>/dev/null || echo '❌ не установлен')
    echo '   Git:' \$(git --version 2>/dev/null || echo '❌ не установлен')
"

echo ""
echo "3️⃣ Проверка директории проекта..."

if ssh -i "$SSH_KEY" root@"$SERVER" "test -d $DEPLOY_PATH" 2>/dev/null; then
    echo "   ✅ Директория $DEPLOY_PATH существует"
    
    echo ""
    echo "   📋 Содержимое директории:"
    ssh -i "$SSH_KEY" root@"$SERVER" "ls -la $DEPLOY_PATH | head -10"
    
    echo ""
    echo "   🔍 Проверка Git репозитория:"
    if ssh -i "$SSH_KEY" root@"$SERVER" "cd $DEPLOY_PATH && git remote -v" 2>/dev/null; then
        echo "   ✅ Git репозиторий настроен"
    else
        echo "   ⚠️  Git репозиторий не настроен"
        echo ""
        echo "   💡 Нужно клонировать репозиторий:"
        echo "      ssh -i $SSH_KEY root@$SERVER"
        echo "      cd /opt && git clone <repository-url> personal-page"
    fi
else
    echo "   ❌ Директория $DEPLOY_PATH не найдена"
    echo ""
    echo "   💡 Нужно создать директорию и клонировать репозиторий:"
    echo "      ssh -i $SSH_KEY root@$SERVER"
    echo "      mkdir -p /opt && cd /opt"
    echo "      git clone <repository-url> personal-page"
fi

echo ""
echo "4️⃣ Проверка Docker контейнеров..."

ssh -i "$SSH_KEY" root@"$SERVER" "
    if [ -d $DEPLOY_PATH ] && [ -f $DEPLOY_PATH/docker-compose.yml ]; then
        cd $DEPLOY_PATH
        echo '   📊 Текущие контейнеры:'
        docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || echo '   Нет запущенных контейнеров'
    else
        echo '   ⚠️  docker-compose.yml не найден'
    fi
"

echo ""
echo "✅ Проверка завершена!"

