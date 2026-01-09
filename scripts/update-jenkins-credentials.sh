#!/bin/bash

# Скрипт для обновления SSH credentials в Jenkins с правильным ключом

JENKINS_URL="http://192.168.1.49:32768"
JENKINS_USER="ferrpoint"
JENKINS_TOKEN="1191a9f019fc3989d7a5ff30d456fb9cf3"
CREDENTIAL_ID="jenkins-ssh-deploy-key"

# Путь к SSH ключу
SSH_KEY_PATH="${1:-$HOME/.ssh/id_rsa}"

if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ Файл '$SSH_KEY_PATH' не найден"
    echo ""
    echo "💡 Укажите путь к вашему SSH ключу:"
    echo "   $0 ~/.ssh/id_rsa"
    echo "   или"
    echo "   $0 ~/.ssh/id_ed25519"
    exit 1
fi

echo "🔐 Обновление SSH credentials в Jenkins..."
echo "   Ключ: $SSH_KEY_PATH"
echo ""

# Читаем приватный ключ
SSH_PRIVATE_KEY=$(cat "$SSH_KEY_PATH")
SSH_PUBLIC_KEY=$(ssh-keygen -y -f "$SSH_KEY_PATH" 2>/dev/null || echo "")

if [ -z "$SSH_PRIVATE_KEY" ]; then
    echo "❌ Не удалось прочитать SSH ключ"
    exit 1
fi

echo "✅ SSH ключ прочитан"
echo ""

# Удаляем старые credentials
echo "🗑️  Удаление старых credentials..."
curl -s -X POST \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    "$JENKINS_URL/credentials/store/system/domain/_/credential/$CREDENTIAL_ID/doDelete" > /dev/null

sleep 1

# Создаем новые credentials
echo "🚀 Создание новых credentials..."

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
    "description": "SSH key for deployment server (azhukov-dev)",
    "stapler-class": "com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey"
  }
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -u "$JENKINS_USER:$JENKINS_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$CREDENTIAL_JSON" \
    "$JENKINS_URL/credentials/store/system/domain/_/createCredentials")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Credentials успешно обновлены!"
    echo ""
    echo "📊 Информация:"
    echo "   ID: $CREDENTIAL_ID"
    echo "   Username: root"
    echo "   Key: $SSH_KEY_PATH"
    if [ -n "$SSH_PUBLIC_KEY" ]; then
        echo "   Public Key:"
        echo "$SSH_PUBLIC_KEY" | sed 's/^/   /'
    fi
else
    echo "❌ Ошибка при обновлении credentials"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $(echo "$RESPONSE" | head -n-1)"
    echo ""
    echo "💡 Обновите credentials вручную через Jenkins UI:"
    echo "   $JENKINS_URL/credentials/store/system/domain/_/"
    exit 1
fi

echo ""
echo "✅ Готово!"

