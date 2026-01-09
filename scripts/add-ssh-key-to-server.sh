#!/bin/bash

# Скрипт для добавления публичного SSH ключа на сервер деплоя

SERVER="7eb10d5af2ad.vps.myjino.ru"
PORT="49233"
USER="root"
SSH_KEY_PUB="~/.ssh/jenkins_deploy_key.pub"

echo "🔐 Добавление SSH ключа на сервер деплоя..."
echo ""

# Читаем публичный ключ
if [ -f ~/.ssh/jenkins_deploy_key.pub ]; then
    PUB_KEY=$(cat ~/.ssh/jenkins_deploy_key.pub)
    echo "📋 Публичный ключ:"
    echo "$PUB_KEY"
    echo ""
    
    echo "🚀 Добавление ключа на сервер..."
    echo "$PUB_KEY" | ssh -p "$PORT" "$USER@$SERVER" \
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
         cat >> ~/.ssh/authorized_keys && \
         chmod 600 ~/.ssh/authorized_keys && \
         echo '✅ SSH ключ добавлен на сервер'"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Ключ успешно добавлен на сервер!"
        echo ""
        echo "🧪 Проверка подключения..."
        ssh -p "$PORT" -i ~/.ssh/jenkins_deploy_key "$USER@$SERVER" \
            "echo '✅ SSH подключение работает!'" 2>&1
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Все готово! SSH ключ настроен и работает."
        else
            echo ""
            echo "⚠️  Ключ добавлен, но проверка подключения не прошла"
            echo "💡 Проверьте вручную: ssh -p $PORT -i ~/.ssh/jenkins_deploy_key $USER@$SERVER"
        fi
    else
        echo ""
        echo "❌ Ошибка при добавлении ключа на сервер"
        echo ""
        echo "💡 Добавьте ключ вручную:"
        echo "   1. Скопируйте публичный ключ выше"
        echo "   2. Подключитесь к серверу: ssh -p $PORT $USER@$SERVER"
        echo "   3. Выполните:"
        echo "      mkdir -p ~/.ssh"
        echo "      chmod 700 ~/.ssh"
        echo "      echo '$PUB_KEY' >> ~/.ssh/authorized_keys"
        echo "      chmod 600 ~/.ssh/authorized_keys"
    fi
else
    echo "❌ Файл ~/.ssh/jenkins_deploy_key.pub не найден"
    exit 1
fi

