#!/bin/bash

# Скрипт для создания Jenkins job через REST API

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"
JOB_NAME="personal-page-deploy"

# URL репозитория (нужно указать)
REPO_URL="${1:-}"

if [ -z "$REPO_URL" ]; then
    echo "❌ Ошибка: Укажите URL репозитория"
    echo "Использование: $0 <repository-url>"
    echo "Пример: $0 https://github.com/username/personal-page.git"
    exit 1
fi

echo "🔍 Проверка подключения к Jenkins..."
if ! curl -s -f -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json" > /dev/null; then
    echo "❌ Не удалось подключиться к Jenkins"
    exit 1
fi
echo "✅ Jenkins доступен"

echo ""
echo "📋 Проверка существования job '$JOB_NAME'..."
if curl -s -f -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/job/$JOB_NAME/api/json" > /dev/null; then
    echo "⚠️  Job '$JOB_NAME' уже существует"
    read -p "Удалить существующий job? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Удаление job..."
        curl -s -X POST -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/job/$JOB_NAME/doDelete"
        sleep 2
    else
        echo "❌ Отменено"
        exit 1
    fi
fi

echo ""
echo "📝 Создание конфигурации job..."

# Создаем временный файл с конфигурацией
TEMP_CONFIG=$(mktemp)
sed "s|REPO_URL_PLACEHOLDER|$REPO_URL|g" scripts/jenkins-job-config.xml > "$TEMP_CONFIG"

echo ""
echo "🚀 Создание job '$JOB_NAME'..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    -H "Content-Type: application/xml" \
    --data-binary "@$TEMP_CONFIG" \
    "$JENKINS_URL/createItem?name=$JOB_NAME")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Job '$JOB_NAME' успешно создан!"
    echo ""
    echo "📊 Информация о job:"
    echo "   URL: $JENKINS_URL/job/$JOB_NAME"
    echo "   Репозиторий: $REPO_URL"
    echo ""
    echo "💡 Следующие шаги:"
    echo "   1. Настройте SSH credentials в Jenkins:"
    echo "      Manage Jenkins → Credentials → Add Credentials"
    echo "      ID: jenkins-ssh-deploy-key"
    echo "      Username: root"
    echo "      Private Key: ваш SSH ключ для сервера"
    echo ""
    echo "   2. Запустите первый build:"
    echo "      $JENKINS_URL/job/$JOB_NAME/build?delay=0sec"
    echo ""
    echo "   3. Или через API:"
    echo "      curl -X POST -u $JENKINS_USER:$JENKINS_TOKEN \\"
    echo "        $JENKINS_URL/job/$JOB_NAME/build"
else
    echo "❌ Ошибка при создании job"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    rm -f "$TEMP_CONFIG"
    exit 1
fi

rm -f "$TEMP_CONFIG"
echo "✅ Готово!"

