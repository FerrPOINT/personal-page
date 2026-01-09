#!/bin/bash

# Инструкция по созданию SSH credentials вручную

SSH_KEY_PATH="${1:-$HOME/.ssh/id_ed25519}"

if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ Файл '$SSH_KEY_PATH' не найден"
    exit 1
fi

echo "📋 Инструкция по созданию SSH credentials в Jenkins"
echo "=================================================="
echo ""
echo "1. Откройте Jenkins: http://192.168.1.49:32768/"
echo "2. Перейдите: Manage Jenkins → Credentials → System → Global credentials"
echo "3. Нажмите 'Add Credentials'"
echo ""
echo "4. Заполните форму:"
echo "   - Kind: SSH Username with private key"
echo "   - Scope: Global"
echo "   - ID: jenkins-ssh-deploy-key"
echo "   - Description: SSH key for deployment server"
echo "   - Username: root"
echo "   - Private Key: Enter directly"
echo ""
echo "5. Вставьте следующий приватный ключ:"
echo "--------------------------------------"
cat "$SSH_KEY_PATH"
echo "--------------------------------------"
echo ""
echo "6. Нажмите OK"
echo ""
echo "✅ Credentials будут созданы!"

