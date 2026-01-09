#!/bin/bash

# Скрипт для настройки ngrok туннеля для Jenkins
# Пробрасывает локальный Jenkins (192.168.1.49:32768) в интернет

set -e

JENKINS_PORT="${JENKINS_PORT:-32768}"
NGROK_AUTH_TOKEN="${NGROK_AUTH_TOKEN:-}"  # Получить на https://dashboard.ngrok.com/get-started/your-authtoken

echo "🔧 Настройка ngrok туннеля для Jenkins..."

# Проверяем, установлен ли ngrok
if ! command -v ngrok &> /dev/null; then
    echo "📦 Установка ngrok..."
    
    # Определяем ОС
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install ngrok/ngrok/ngrok
    else
        echo "❌ Неподдерживаемая ОС. Установите ngrok вручную: https://ngrok.com/download"
        exit 1
    fi
fi

# Настраиваем авторизацию (если токен указан)
if [ -n "$NGROK_AUTH_TOKEN" ]; then
    echo "🔑 Настройка ngrok авторизации..."
    ngrok config add-authtoken "$NGROK_AUTH_TOKEN"
fi

# Создаем конфигурацию ngrok
NGROK_CONFIG_DIR="$HOME/.ngrok2"
mkdir -p "$NGROK_CONFIG_DIR"

cat > "$NGROK_CONFIG_DIR/ngrok.yml" <<EOF
version: "2"
authtoken: ${NGROK_AUTH_TOKEN:-}
tunnels:
  jenkins:
    addr: ${JENKINS_PORT}
    proto: http
    bind_tls: true
EOF

echo "✅ Конфигурация ngrok создана"
echo ""
echo "🚀 Запуск ngrok туннеля:"
echo "   ngrok http $JENKINS_PORT"
echo ""
echo "📋 После запуска получите публичный URL (например: https://xxxx-xx-xx-xx-xx.ngrok-free.app)"
echo "   и настройте GitHub webhook на: https://xxxx-xx-xx-xx-xx.ngrok-free.app/github-webhook/"
echo ""
echo "💡 Для постоянной работы запустите ngrok как сервис:"
echo "   ngrok service install"
echo "   ngrok service start"

