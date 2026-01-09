#!/bin/bash

# Полная настройка Jenkins для автоматического деплоя

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"

echo "🚀 Полная настройка Jenkins для автоматического деплоя"
echo "=================================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для проверки подключения
check_jenkins() {
    echo "🔍 Проверка подключения к Jenkins..."
    if ! curl -s -f -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json" > /dev/null; then
        echo -e "${RED}❌ Не удалось подключиться к Jenkins${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Jenkins доступен${NC}"
}

# Функция для проверки плагинов
check_plugins() {
    echo ""
    echo "📦 Проверка установленных плагинов..."
    
    PLUGINS=(
        "workflow-aggregator:Pipeline"
        "ssh-steps:SSH Pipeline Steps"
        "docker-workflow:Docker Pipeline"
        "git:Git Plugin"
        "ssh-credentials:SSH Credentials"
    )
    
    MISSING_PLUGINS=()
    
    for PLUGIN_INFO in "${PLUGINS[@]}"; do
        PLUGIN_ID=$(echo "$PLUGIN_INFO" | cut -d':' -f1)
        PLUGIN_NAME=$(echo "$PLUGIN_INFO" | cut -d':' -f2)
        
        INSTALLED=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
            "$JENKINS_URL/pluginManager/api/json?depth=1" | \
            grep -o "\"shortName\":\"$PLUGIN_ID\"" || echo "")
        
        if [ -n "$INSTALLED" ]; then
            echo -e "   ${GREEN}✅${NC} $PLUGIN_NAME ($PLUGIN_ID)"
        else
            echo -e "   ${RED}❌${NC} $PLUGIN_NAME ($PLUGIN_ID) - не установлен"
            MISSING_PLUGINS+=("$PLUGIN_ID")
        fi
    done
    
    if [ ${#MISSING_PLUGINS[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Необходимо установить следующие плагины:${NC}"
        for PLUGIN in "${MISSING_PLUGINS[@]}"; do
            echo "   - $PLUGIN"
        done
        echo ""
        echo "💡 Установите их через Jenkins UI:"
        echo "   $JENKINS_URL/pluginManager/available"
        echo ""
        read -p "Нажмите Enter после установки плагинов..."
    fi
}

# Функция для проверки SSH credentials
check_ssh_credentials() {
    echo ""
    echo "🔐 Проверка SSH credentials..."
    
    CREDENTIAL_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
        -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/credentials/store/system/domain/_/credential/jenkins-ssh-deploy-key/api/json")
    
    if [ "$CREDENTIAL_EXISTS" = "200" ]; then
        echo -e "   ${GREEN}✅${NC} SSH credentials 'jenkins-ssh-deploy-key' настроены"
    else
        echo -e "   ${RED}❌${NC} SSH credentials 'jenkins-ssh-deploy-key' не настроены"
        echo ""
        echo "💡 Настройте SSH credentials:"
        echo ""
        echo "   Вариант 1: Через скрипт (если есть SSH ключ):"
        echo "   bash scripts/setup-jenkins-ssh-credentials.sh ~/.ssh/id_rsa"
        echo ""
        echo "   Вариант 2: Через Jenkins UI:"
        echo "   1. $JENKINS_URL/credentials/store/system/domain/_/"
        echo "   2. Add Credentials"
        echo "   3. Kind: SSH Username with private key"
        echo "   4. ID: jenkins-ssh-deploy-key"
        echo "   5. Username: root"
        echo "   6. Private Key: вставьте приватный ключ"
        echo ""
        
        read -p "У вас есть SSH ключ для сервера? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Введите путь к приватному SSH ключу: " SSH_KEY_PATH
            if [ -f "$SSH_KEY_PATH" ]; then
                bash scripts/setup-jenkins-ssh-credentials.sh "$SSH_KEY_PATH"
            else
                echo -e "${RED}❌ Файл не найден${NC}"
            fi
        fi
    fi
}

# Функция для проверки job
check_job() {
    echo ""
    echo "📋 Проверка Jenkins job..."
    
    JOB_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
        -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/job/personal-page-deploy/api/json")
    
    if [ "$JOB_EXISTS" = "200" ]; then
        echo -e "   ${GREEN}✅${NC} Job 'personal-page-deploy' существует"
        echo "   URL: $JENKINS_URL/job/personal-page-deploy"
    else
        echo -e "   ${RED}❌${NC} Job 'personal-page-deploy' не найден"
        echo ""
        echo "💡 Создайте job:"
        echo "   bash scripts/create-jenkins-job.sh git@github.com:FerrPOINT/personal-page.git"
    fi
}

# Функция для тестового запуска
test_build() {
    echo ""
    echo "🧪 Тестовый запуск build..."
    read -p "Запустить тестовый build? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bash scripts/trigger-jenkins-build.sh
        echo ""
        echo "💡 Отслеживайте прогресс:"
        echo "   $JENKINS_URL/job/personal-page-deploy"
    fi
}

# Главная функция
main() {
    check_jenkins
    check_plugins
    check_ssh_credentials
    check_job
    
    echo ""
    echo "=================================================="
    echo -e "${GREEN}✅ Проверка завершена!${NC}"
    echo ""
    
    # Итоговый статус
    echo "📊 Итоговый статус:"
    
    # Проверяем все компоненты еще раз
    PLUGINS_OK=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/pluginManager/api/json?depth=1" | \
        grep -o "\"shortName\":\"workflow-aggregator\"" || echo "")
    
    CREDENTIALS_OK=$(curl -s -o /dev/null -w "%{http_code}" \
        -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/credentials/store/system/domain/_/credential/jenkins-ssh-deploy-key/api/json")
    
    JOB_OK=$(curl -s -o /dev/null -w "%{http_code}" \
        -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/job/personal-page-deploy/api/json")
    
    if [ -n "$PLUGINS_OK" ] && [ "$CREDENTIALS_OK" = "200" ] && [ "$JOB_OK" = "200" ]; then
        echo -e "   ${GREEN}✅${NC} Все компоненты настроены"
        echo ""
        test_build
    else
        echo -e "   ${YELLOW}⚠️${NC}  Некоторые компоненты требуют настройки"
        echo ""
        echo "Следующие шаги:"
        [ -z "$PLUGINS_OK" ] && echo "   - Установите недостающие плагины"
        [ "$CREDENTIALS_OK" != "200" ] && echo "   - Настройте SSH credentials"
        [ "$JOB_OK" != "200" ] && echo "   - Создайте Jenkins job"
    fi
    
    echo ""
    echo "📚 Документация:"
    echo "   - Быстрый старт: info/jenkins-quickstart.qmd"
    echo "   - Полная документация: info/jenkins-pipeline.qmd"
    echo "   - Автоматическая настройка: info/jenkins-auto-setup.qmd"
}

main

