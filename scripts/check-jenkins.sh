#!/bin/bash

# Скрипт для проверки подключения к Jenkins API

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"

echo "🔍 Проверка подключения к Jenkins..."
echo "URL: $JENKINS_URL"
echo "User: $JENKINS_USER"
echo ""

# Проверка доступности Jenkins
echo "1️⃣ Проверка доступности Jenkins..."
if curl -s -f -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json" > /dev/null; then
    echo "✅ Jenkins доступен"
else
    echo "❌ Jenkins недоступен"
    exit 1
fi

# Получение версии Jenkins
echo ""
echo "2️⃣ Получение версии Jenkins..."
VERSION=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json?tree=version" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
echo "Версия: $VERSION"

# Список jobs
echo ""
echo "3️⃣ Список jobs:"
curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json?tree=jobs[name,url,color]" | \
    grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read job; do
    echo "  - $job"
done

# Проверка конкретного job
JOB_NAME="personal-page-deploy"
echo ""
echo "4️⃣ Проверка job '$JOB_NAME'..."
JOB_URL="$JENKINS_URL/job/$JOB_NAME"
if curl -s -f -u "$JENKINS_USER:$JENKINS_TOKEN" "$JOB_URL/api/json" > /dev/null; then
    echo "✅ Job '$JOB_NAME' существует"
    
    # Получение последнего build
    LAST_BUILD=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" "$JOB_URL/api/json?tree=lastBuild[number,result,url]" | \
        grep -o '"number":[0-9]*' | cut -d':' -f2)
    if [ -n "$LAST_BUILD" ]; then
        echo "   Последний build: #$LAST_BUILD"
        RESULT=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" "$JOB_URL/api/json?tree=lastBuild[result]" | \
            grep -o '"result":"[^"]*"' | cut -d'"' -f4)
        echo "   Результат: $RESULT"
    fi
else
    echo "⚠️  Job '$JOB_NAME' не найден"
fi

echo ""
echo "✅ Проверка завершена"

