#!/bin/bash

# Обновление Jenkins job для использования HTTPS вместо SSH (если репозиторий публичный)

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"
JOB_NAME="personal-page-deploy"

# Используем HTTPS URL (работает для публичных репозиториев)
REPO_URL_HTTPS="https://github.com/FerrPOINT/personal-page.git"

echo "🔄 Обновление Jenkins job для использования HTTPS..."

# Получаем текущую конфигурацию
CURRENT_CONFIG=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
    "$JENKINS_URL/job/$JOB_NAME/config.xml")

# Заменяем SSH URL на HTTPS
NEW_CONFIG=$(echo "$CURRENT_CONFIG" | sed "s|git@github.com:FerrPOINT/personal-page.git|$REPO_URL_HTTPS|g")

# Обновляем конфигурацию
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    -H "Content-Type: application/xml" \
    --data-binary "$NEW_CONFIG" \
    "$JENKINS_URL/job/$JOB_NAME/config.xml")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Job обновлен для использования HTTPS"
    echo "   Репозиторий: $REPO_URL_HTTPS"
else
    echo "❌ Ошибка при обновлении job"
    echo "HTTP Code: $HTTP_CODE"
    exit 1
fi

echo ""
echo "💡 Теперь можно запустить build снова:"
echo "   bash scripts/trigger-jenkins-build.sh"

