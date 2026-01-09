#!/bin/bash

# Git post-receive hook для автоматического запуска Jenkins build
# Разместить на сервере в: /opt/personal-page/.git/hooks/post-receive
# Или в bare репозитории: /path/to/repo.git/hooks/post-receive

set -e

# Настройки Jenkins
JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"
JOB_NAME="personal-page-deploy"

# Проверяем, что push был в main ветку
while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    
    if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
        echo "🔄 Обнаружен push в ветку $branch"
        echo "🚀 Запуск Jenkins build..."
        
        # Запускаем Jenkins build через API
        HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/jenkins-response.txt \
            -X POST \
            -u "$JENKINS_USER:$JENKINS_TOKEN" \
            "$JENKINS_URL/job/$JOB_NAME/build")
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
            echo "✅ Jenkins build запущен успешно!"
            echo "📊 Отслеживание: $JENKINS_URL/job/$JOB_NAME"
        else
            echo "❌ Ошибка при запуске Jenkins build (HTTP $HTTP_CODE)"
            cat /tmp/jenkins-response.txt
            exit 1
        fi
    fi
done

