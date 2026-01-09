#!/bin/bash

# Финальная проверка готовности Jenkins к деплою

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"

echo "🔍 Финальная проверка Jenkins для деплоя"
echo "=========================================="
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# 1. Проверка подключения к Jenkins
echo "1️⃣ Проверка подключения к Jenkins..."
if curl -s -f -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json" > /dev/null; then
    echo -e "   ${GREEN}✅${NC} Jenkins доступен"
else
    echo -e "   ${RED}❌${NC} Jenkins недоступен"
    ERRORS=$((ERRORS + 1))
fi

# 2. Проверка плагинов
echo ""
echo "2️⃣ Проверка плагинов..."
PLUGINS=("workflow-aggregator" "ssh-steps" "docker-workflow" "git" "ssh-credentials")
for PLUGIN in "${PLUGINS[@]}"; do
    INSTALLED=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/pluginManager/api/json?depth=1" | \
        grep -o "\"shortName\":\"$PLUGIN\"" || echo "")
    if [ -n "$INSTALLED" ]; then
        echo -e "   ${GREEN}✅${NC} $PLUGIN"
    else
        echo -e "   ${RED}❌${NC} $PLUGIN (не установлен)"
        ERRORS=$((ERRORS + 1))
    fi
done

# 3. Проверка credentials
echo ""
echo "3️⃣ Проверка SSH credentials..."
CREDENTIAL_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    "$JENKINS_URL/credentials/store/system/domain/_/credential/jenkins-ssh-deploy-key/api/json")
if [ "$CREDENTIAL_EXISTS" = "200" ]; then
    echo -e "   ${GREEN}✅${NC} SSH credentials 'jenkins-ssh-deploy-key' настроены"
else
    echo -e "   ${RED}❌${NC} SSH credentials 'jenkins-ssh-deploy-key' не настроены"
    ERRORS=$((ERRORS + 1))
fi

# 4. Проверка job
echo ""
echo "4️⃣ Проверка Jenkins job..."
JOB_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    "$JENKINS_URL/job/personal-page-deploy/api/json")
if [ "$JOB_EXISTS" = "200" ]; then
    echo -e "   ${GREEN}✅${NC} Job 'personal-page-deploy' существует"
    
    # Проверяем конфигурацию
    CONFIG=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/job/personal-page-deploy/config.xml")
    
    if echo "$CONFIG" | grep -q "azhukov-dev"; then
        echo -e "   ${GREEN}✅${NC} Хост настроен: azhukov-dev"
    else
        echo -e "   ${YELLOW}⚠️${NC}  Хост в конфигурации может отличаться"
    fi
else
    echo -e "   ${RED}❌${NC} Job 'personal-page-deploy' не найден"
    ERRORS=$((ERRORS + 1))
fi

# 5. Проверка Jenkinsfile в репозитории
echo ""
echo "5️⃣ Проверка Jenkinsfile в репозитории..."
if [ -f "Jenkinsfile" ]; then
    echo -e "   ${GREEN}✅${NC} Jenkinsfile существует локально"
    
    # Проверяем хост в Jenkinsfile
    if grep -q "DEPLOY_HOST = 'azhukov-dev'" Jenkinsfile; then
        echo -e "   ${GREEN}✅${NC} Хост настроен: azhukov-dev"
    else
        echo -e "   ${YELLOW}⚠️${NC}  Хост в Jenkinsfile может отличаться"
    fi
else
    echo -e "   ${RED}❌${NC} Jenkinsfile не найден"
    ERRORS=$((ERRORS + 1))
fi

# 6. Проверка скрипта deploy.sh
echo ""
echo "6️⃣ Проверка скрипта deploy.sh..."
if [ -f "scripts/deploy.sh" ]; then
    echo -e "   ${GREEN}✅${NC} Скрипт deploy.sh существует"
    if [ -x "scripts/deploy.sh" ]; then
        echo -e "   ${GREEN}✅${NC} Скрипт исполняемый"
    else
        echo -e "   ${YELLOW}⚠️${NC}  Скрипт не исполняемый (будет chmod +x при деплое)"
    fi
else
    echo -e "   ${RED}❌${NC} Скрипт deploy.sh не найден"
    ERRORS=$((ERRORS + 1))
fi

# Итог
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Все проверки пройдены!${NC}"
    echo ""
    echo "💡 Следующие шаги:"
    echo "   1. Убедитесь, что SSH ключ правильный в Jenkins credentials"
    echo "   2. Проверьте, что репозиторий клонирован на сервере azhukov-dev"
    echo "   3. Запустите тестовый build:"
    echo "      bash scripts/trigger-jenkins-build.sh"
else
    echo -e "${RED}❌ Найдено ошибок: $ERRORS${NC}"
    echo ""
    echo "💡 Исправьте ошибки перед запуском деплоя"
fi

