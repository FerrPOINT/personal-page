#!/bin/bash

# Скрипт для установки необходимых плагинов в Jenkins

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"

# Список необходимых плагинов
PLUGINS=(
    "workflow-aggregator"      # Pipeline
    "ssh-steps"                # SSH Pipeline Steps
    "docker-workflow"          # Docker Pipeline
    "git"                      # Git Plugin
    "ssh-credentials"          # SSH Credentials Plugin
    "github"                   # GitHub Plugin (опционально)
)

echo "🔍 Проверка подключения к Jenkins..."
if ! curl -s -f -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json" > /dev/null; then
    echo "❌ Не удалось подключиться к Jenkins"
    exit 1
fi
echo "✅ Jenkins доступен"

echo ""
echo "📦 Установка плагинов..."

for PLUGIN in "${PLUGINS[@]}"; do
    echo ""
    echo "🔧 Проверка плагина: $PLUGIN"
    
    # Проверяем, установлен ли плагин
    INSTALLED=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/pluginManager/api/json?depth=1" | \
        grep -o "\"shortName\":\"$PLUGIN\"" || echo "")
    
    if [ -n "$INSTALLED" ]; then
        echo "   ✅ Плагин '$PLUGIN' уже установлен"
    else
        echo "   📥 Установка плагина '$PLUGIN'..."
        
        # Устанавливаем плагин
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            -u "$JENKINS_USER:$JENKINS_TOKEN" \
            -H "Content-Type: application/xml" \
            -d "<install plugin=\"$PLUGIN@latest\" />" \
            "$JENKINS_URL/pluginManager/installNecessaryPlugins")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
            echo "   ✅ Плагин '$PLUGIN' поставлен в очередь на установку"
        else
            echo "   ⚠️  Не удалось установить плагин '$PLUGIN' (HTTP: $HTTP_CODE)"
            echo "   💡 Возможно, нужно установить вручную через UI"
        fi
    fi
done

echo ""
echo "⏳ Ожидание завершения установки плагинов..."
echo "   (Это может занять несколько минут)"

# Проверяем статус установки
sleep 5
for i in {1..12}; do
    INSTALLING=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/updateCenter/api/json?tree=jobs[type,status]" | \
        grep -o '"status":"[^"]*"' | grep -v "Success" || echo "")
    
    if [ -z "$INSTALLING" ]; then
        echo "✅ Все плагины установлены"
        break
    fi
    
    if [ $i -eq 12 ]; then
        echo "⚠️  Установка плагинов все еще выполняется"
        echo "💡 Проверьте статус в Jenkins UI: $JENKINS_URL/pluginManager/"
    else
        echo "   Ожидание... ($i/12)"
        sleep 10
    fi
done

echo ""
echo "📋 Проверка установленных плагинов..."
for PLUGIN in "${PLUGINS[@]}"; do
    INSTALLED=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
        "$JENKINS_URL/pluginManager/api/json?depth=1" | \
        grep -o "\"shortName\":\"$PLUGIN\"" || echo "")
    
    if [ -n "$INSTALLED" ]; then
        echo "   ✅ $PLUGIN"
    else
        echo "   ❌ $PLUGIN (не установлен)"
    fi
done

echo ""
echo "💡 Если некоторые плагины не установились автоматически,"
echo "   установите их вручную:"
echo "   $JENKINS_URL/pluginManager/available"
echo ""
echo "✅ Готово!"

