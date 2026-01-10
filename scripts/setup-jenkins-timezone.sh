#!/bin/bash

# Скрипт для настройки новосибирского часового пояса в Jenkins
# Использование: ./scripts/setup-jenkins-timezone.sh

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"
TIMEZONE="Asia/Novosibirsk"

echo "🕐 Настройка часового пояса Jenkins на $TIMEZONE..."

# 1. Установка часового пояса на уровне системы (если есть доступ к серверу)
echo "📋 Инструкция для установки часового пояса на сервере:"
echo "   ssh root@azhukov-dev"
echo "   timedatectl set-timezone $TIMEZONE"
echo "   timedatectl status"
echo ""

# 2. Настройка часового пояса в Jenkins через Groovy Script Console
echo "🔧 Настройка часового пояса в Jenkins через API..."

# Получаем CSRF токен
CSRF_CRUMB=$(curl -s -u "$JENKINS_USER:$JENKINS_TOKEN" \
    "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)")

if [ -z "$CSRF_CRUMB" ]; then
    echo "⚠️  Не удалось получить CSRF токен. Пробуем без него..."
    CSRF_HEADER=""
else
    CSRF_HEADER="-H \"$CSRF_CRUMB\""
fi

# Groovy скрипт для установки часового пояса
GROOVY_SCRIPT=$(cat <<'EOF'
import jenkins.model.Jenkins
import java.util.TimeZone

// Устанавливаем часовой пояс
TimeZone.setDefault(TimeZone.getTimeZone("Asia/Novosibirsk"))

// Сохраняем конфигурацию
Jenkins.instance.save()

println "Часовой пояс установлен: " + TimeZone.getDefault().getID()
println "Текущее время: " + new Date()
EOF
)

# Создаем временный файл для Groovy скрипта
TEMP_SCRIPT=$(mktemp)
echo "$GROOVY_SCRIPT" > "$TEMP_SCRIPT"

# Выполняем Groovy скрипт через Script Console API
if [ -n "$CSRF_CRUMB" ]; then
    CRUMB_FIELD=$(echo "$CSRF_CRUMB" | cut -d: -f1)
    CRUMB_VALUE=$(echo "$CSRF_CRUMB" | cut -d: -f2)
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -u "$JENKINS_USER:$JENKINS_TOKEN" \
        -H "$CRUMB_FIELD: $CRUMB_VALUE" \
        --data-urlencode "script@$TEMP_SCRIPT" \
        "$JENKINS_URL/scriptText")
else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -u "$JENKINS_USER:$JENKINS_TOKEN" \
        --data-urlencode "script@$TEMP_SCRIPT" \
        "$JENKINS_URL/scriptText")
fi

# Удаляем временный файл
rm -f "$TEMP_SCRIPT"

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Часовой пояс успешно установлен в Jenkins!"
    echo "$RESPONSE_BODY"
else
    echo "❌ Ошибка при установке часового пояса"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
    echo ""
    echo "📋 Альтернативный способ - через Jenkins UI:"
    echo "   1. Откройте: $JENKINS_URL/manage"
    echo "   2. Перейдите: Manage Jenkins → Script Console"
    echo "   3. Вставьте следующий скрипт:"
    echo ""
    echo "$GROOVY_SCRIPT"
    echo ""
    echo "   4. Нажмите 'Run'"
fi

echo ""
echo "📋 Для проверки времени в Jenkins:"
echo "   Откройте: $JENKINS_URL/systemInfo"
echo "   Найдите 'user.timezone' - должно быть: $TIMEZONE"

