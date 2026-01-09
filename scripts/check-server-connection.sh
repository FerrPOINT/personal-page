#!/bin/bash

# Скрипт для проверки подключения к серверу деплоя

echo "🔍 Проверка подключения к серверу деплоя..."
echo ""

# Пробуем разные варианты подключения
HOSTS=("azhukov-dev" "7eb10d5af2ad.vps.myjino.ru")
KEYS=("~/.ssh/id_rsa" "~/.ssh/id_ed25519" "~/.ssh/jenkins_deploy_key")

for HOST in "${HOSTS[@]}"; do
    for KEY in "${KEYS[@]}"; do
        KEY_PATH="${KEY/#\~/$HOME}"
        if [ -f "$KEY_PATH" ]; then
            echo "Проверка: ssh -i $KEY_PATH root@$HOST"
            if ssh -i "$KEY_PATH" -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@"$HOST" "echo '✅ Подключение работает' && hostname" 2>/dev/null; then
                echo ""
                echo "✅ Успешное подключение!"
                echo "   Host: $HOST"
                echo "   Key: $KEY_PATH"
                echo ""
                echo "📋 Информация о сервере:"
                ssh -i "$KEY_PATH" root@"$HOST" "
                    echo '  Hostname:' \$(hostname)
                    echo '  IP:' \$(hostname -I | awk '{print \$1}')
                    echo '  Docker:' \$(docker --version 2>/dev/null || echo 'не установлен')
                    echo '  Docker Compose:' \$(docker compose version 2>/dev/null || echo 'не установлен')
                    echo '  Git:' \$(git --version 2>/dev/null || echo 'не установлен')
                    echo '  Директория /opt/personal-page:' \$(test -d /opt/personal-page && echo 'существует' || echo 'не найдена')
                "
                exit 0
            fi
        fi
    done
done

echo "❌ Не удалось подключиться к серверу"
echo ""
echo "💡 Проверьте:"
echo "   1. SSH ключ существует и доступен"
echo "   2. Хост доступен из сети"
echo "   3. SSH config настроен правильно"
exit 1

