#!/bin/bash

# Скрипт для получения текущего ngrok URL
# Используется для настройки GitHub webhook

NGROK_API="http://localhost:4040/api/tunnels"

echo "🔍 Получение ngrok публичного URL..."

# Проверяем, запущен ли ngrok
if ! curl -s "$NGROK_API" > /dev/null 2>&1; then
    echo "❌ Ngrok не запущен или недоступен на localhost:4040"
    echo "   Запустите: ngrok http 32768"
    exit 1
fi

# Получаем публичный URL
PUBLIC_URL=$(curl -s "$NGROK_API" | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Не удалось получить публичный URL"
    echo "   Проверьте, что ngrok запущен: curl $NGROK_API"
    exit 1
fi

echo "✅ Публичный URL: $PUBLIC_URL"
echo ""
echo "📋 Настройте GitHub webhook:"
echo "   Payload URL: ${PUBLIC_URL}/github-webhook/"
echo "   Content type: application/json"
echo "   Events: Just the push event"
echo ""
echo "💡 Или через GitHub API:"
echo "   curl -X POST https://api.github.com/repos/FerrPOINT/personal-page/hooks \\"
echo "     -H 'Authorization: token YOUR_GITHUB_TOKEN' \\"
echo "     -d '{\"name\":\"web\",\"active\":true,\"events\":[\"push\"],\"config\":{\"url\":\"${PUBLIC_URL}/github-webhook/\",\"content_type\":\"json\"}}'"

