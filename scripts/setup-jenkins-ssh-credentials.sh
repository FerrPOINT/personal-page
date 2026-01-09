#!/bin/bash

# Скрипт для настройки SSH credentials в Jenkins через REST API
# Требует приватный SSH ключ для доступа к серверу деплоя

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"
CREDENTIAL_ID="jenkins-ssh-deploy-key"

# Путь к приватному SSH ключу
SSH_KEY_PATH="${1:-}"

if [ -z "$SSH_KEY_PATH" ]; then
    echo "❌ Ошибка: Укажите путь к приватному SSH ключу"
    echo "Использование: $0 <path-to-private-key>"
    echo "Пример: $0 ~/.ssh/id_rsa"
    echo ""
    echo "💡 Если ключа нет, создайте его:"
    echo "   ssh-keygen -t ed25519 -C 'jenkins-deploy' -f ~/.ssh/jenkins_deploy_key"
    exit 1
fi

if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ Файл '$SSH_KEY_PATH' не найден"
    exit 1
fi

echo "🔍 Проверка подключения к Jenkins..."
if ! curl -s -f -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json" > /dev/null; then
    echo "❌ Не удалось подключиться к Jenkins"
    exit 1
fi
echo "✅ Jenkins доступен"

echo ""
echo "📋 Проверка существования credentials '$CREDENTIAL_ID'..."

# Проверяем существование credentials
CREDENTIAL_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    "$JENKINS_URL/credentials/store/system/domain/_/credential/$CREDENTIAL_ID/api/json")

if [ "$CREDENTIAL_EXISTS" = "200" ]; then
    echo "⚠️  Credentials '$CREDENTIAL_ID' уже существуют"
    read -p "Удалить существующие credentials? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Удаление credentials..."
        curl -s -X POST \
            -u "$JENKINS_USER:$JENKINS_TOKEN" \
            "$JENKINS_URL/credentials/store/system/domain/_/credential/$CREDENTIAL_ID/doDelete"
        sleep 1
    else
        echo "❌ Отменено"
        exit 1
    fi
fi

echo ""
echo "📝 Чтение SSH ключа..."
SSH_PRIVATE_KEY=$(cat "$SSH_KEY_PATH")
SSH_PUBLIC_KEY=$(ssh-keygen -y -f "$SSH_KEY_PATH" 2>/dev/null || echo "")

if [ -z "$SSH_PRIVATE_KEY" ]; then
    echo "❌ Не удалось прочитать SSH ключ"
    exit 1
fi

echo "✅ SSH ключ прочитан"

echo ""
echo "🚀 Создание credentials..."

# Создаем JSON для credentials
CREDENTIAL_JSON=$(cat <<EOF
{
  "": "0",
  "credentials": {
    "scope": "GLOBAL",
    "id": "$CREDENTIAL_ID",
    "username": "root",
    "usernameSecret": false,
    "privateKeySource": {
      "value": "0",
      "privateKey": "$SSH_PRIVATE_KEY",
      "stapler-class": "com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey\$DirectEntryPrivateKeySource"
    },
    "description": "SSH key for deployment server (7eb10d5af2ad.vps.myjino.ru:49233)",
    "stapler-class": "com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey"
  }
}
EOF
)

# Создаем credentials через API
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$CREDENTIAL_JSON" \
    "$JENKINS_URL/credentials/store/system/domain/_/createCredentials")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Credentials '$CREDENTIAL_ID' успешно созданы!"
    echo ""
    echo "📊 Информация:"
    echo "   ID: $CREDENTIAL_ID"
    echo "   Username: root"
    echo "   Public Key:"
    echo "$SSH_PUBLIC_KEY" | sed 's/^/   /'
    echo ""
    echo "💡 Теперь можно запустить pipeline:"
    echo "   curl -X POST -u $JENKINS_USER:$JENKINS_TOKEN \\"
    echo "     $JENKINS_URL/job/personal-page-deploy/build"
else
    echo "❌ Ошибка при создании credentials"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $(echo "$RESPONSE" | head -n-1)"
    echo ""
    echo "💡 Возможные причины:"
    echo "   1. Плагин SSH Credentials не установлен"
    echo "   2. Недостаточно прав для создания credentials"
    echo "   3. Неправильный формат SSH ключа"
    exit 1
fi

echo "✅ Готово!"

