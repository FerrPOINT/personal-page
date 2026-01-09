#!/bin/bash

# Скрипт для запуска Jenkins build через API

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"
JOB_NAME="personal-page-deploy"

echo "🚀 Запуск Jenkins build для '$JOB_NAME'..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    "$JENKINS_URL/job/$JOB_NAME/build")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Build запущен!"
    echo ""
    echo "📊 Отслеживание прогресса:"
    echo "   $JENKINS_URL/job/$JOB_NAME"
    echo ""
    echo "💡 Просмотр логов:"
    echo "   curl -s -u $JENKINS_USER:$JENKINS_TOKEN \\"
    echo "     \"$JENKINS_URL/job/$JOB_NAME/lastBuild/consoleText\""
else
    echo "❌ Ошибка при запуске build"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $(echo "$RESPONSE" | head -n-1)"
    exit 1
fi

