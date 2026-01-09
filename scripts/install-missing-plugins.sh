#!/bin/bash

# Установка недостающих плагинов через Jenkins REST API

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"

PLUGINS=("ssh-steps" "docker-workflow")

echo "📦 Установка недостающих плагинов..."

for PLUGIN in "${PLUGINS[@]}"; do
    echo ""
    echo "🔧 Установка: $PLUGIN"
    
    # Проверяем, установлен ли уже
    INSTALLED=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/pluginManager/api/json?depth=1" | \
        grep -o "\"shortName\":\"$PLUGIN\"" || echo "")
    
    if [ -n "$INSTALLED" ]; then
        echo "   ✅ Уже установлен"
        continue
    fi
    
    # Устанавливаем через update center
    echo "   📥 Отправка запроса на установку..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -u "$JENKINS_USER:$JENKINS_TOKEN" \
        -H "Content-Type: text/xml" \
        -d "<install plugin=\"$PLUGIN@latest\" />" \
        "$JENKINS_URL/pluginManager/installNecessaryPlugins")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "   ✅ Запрос на установку отправлен"
    else
        echo "   ⚠️  HTTP Code: $HTTP_CODE"
        echo "   💡 Возможно, нужно установить вручную через UI"
    fi
done

echo ""
echo "⏳ Ожидание завершения установки (30 секунд)..."
sleep 30

echo ""
echo "📋 Проверка установленных плагинов:"
for PLUGIN in "${PLUGINS[@]}"; do
    INSTALLED=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/pluginManager/api/json?depth=1" | \
        grep -o "\"shortName\":\"$PLUGIN\"" || echo "")
    
    if [ -n "$INSTALLED" ]; then
        echo "   ✅ $PLUGIN"
    else
        echo "   ❌ $PLUGIN (не установлен - установите вручную)"
    fi
done

echo ""
echo "💡 Если плагины не установились автоматически, установите их вручную:"
echo "   $JENKINS_URL/pluginManager/available"
echo "   Поиск: ssh-steps, docker-workflow"

