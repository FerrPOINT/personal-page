#!/bin/bash

# Скрипт для установки post-receive hook на сервере
# Выполнить на сервере: ssh root@azhukov-dev "bash -s" < scripts/setup-git-hook-on-server.sh

set -e

DEPLOY_PATH="${DEPLOY_PATH:-/opt/personal-page}"
HOOK_PATH="$DEPLOY_PATH/.git/hooks/post-receive"

echo "🔧 Установка post-receive hook на сервере..."

# Проверяем, что репозиторий существует
if [ ! -d "$DEPLOY_PATH/.git" ]; then
    echo "❌ Ошибка: репозиторий не найден в $DEPLOY_PATH"
    exit 1
fi

# Создаем hook из нашего скрипта
cat > "$HOOK_PATH" << 'HOOK_SCRIPT'
#!/bin/bash
set -e

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"
JOB_NAME="personal-page-deploy"

while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    
    if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
        echo "🔄 Push в $branch - запуск Jenkins build..."
        curl -s -X POST -u "$JENKINS_USER:$JENKINS_TOKEN" \
            "$JENKINS_URL/job/$JOB_NAME/build" > /dev/null
        echo "✅ Jenkins build запущен"
    fi
done
HOOK_SCRIPT

chmod +x "$HOOK_PATH"
echo "✅ Post-receive hook установлен: $HOOK_PATH"

