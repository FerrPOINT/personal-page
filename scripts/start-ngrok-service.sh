#!/bin/bash

# Скрипт для запуска ngrok как системного сервиса
# Обеспечивает постоянный туннель для Jenkins

set -e

JENKINS_PORT="${JENKINS_PORT:-32768}"
NGROK_AUTH_TOKEN="${NGROK_AUTH_TOKEN:-}"

echo "🔧 Настройка ngrok как системного сервиса..."

# Проверяем наличие ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok не установлен. Запустите сначала scripts/setup-ngrok-tunnel.sh"
    exit 1
fi

# Настраиваем авторизацию
if [ -n "$NGROK_AUTH_TOKEN" ]; then
    ngrok config add-authtoken "$NGROK_AUTH_TOKEN"
fi

# Устанавливаем ngrok как сервис
echo "📦 Установка ngrok service..."
ngrok service install

# Создаем конфигурацию для сервиса
cat > /etc/systemd/system/ngrok-jenkins.service <<EOF
[Unit]
Description=Ngrok tunnel for Jenkins
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/local/bin/ngrok http $JENKINS_PORT --log=stdout
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Перезагружаем systemd и запускаем сервис
systemctl daemon-reload
systemctl enable ngrok-jenkins
systemctl start ngrok-jenkins

echo "✅ Ngrok сервис установлен и запущен"
echo ""
echo "📊 Проверка статуса:"
echo "   systemctl status ngrok-jenkins"
echo ""
echo "📋 Получить публичный URL:"
echo "   curl http://localhost:4040/api/tunnels | grep -o 'https://[^"]*'"
echo ""
echo "💡 Настройте GitHub webhook на полученный URL + /github-webhook/"

