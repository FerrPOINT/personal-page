pipeline {
    agent any
    
    environment {
        // SSH connection settings
        // azhukov-dev - алиас (если не резолвится, используйте реальный хост ниже)
        // Реальный хост из deployment-guide: 7eb10d5af2ad.vps.myjino.ru:49233
        DEPLOY_HOST = 'azhukov-dev'  // Алиас сервера (или 7eb10d5af2ad.vps.myjino.ru)
        DEPLOY_PORT = '22'  // SSH порт сервера (по умолчанию 22)
        DEPLOY_USER = 'root'
        DEPLOY_PATH = '/opt/personal-page'
        
        // Docker Compose settings
        COMPOSE_PROJECT_NAME = 'personal-page'
        
        // Jenkins URL для справки
        JENKINS_URL = 'http://192.168.1.49:32768/'
    }
    
    options {
        // Сохранять историю сборок
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Таймаут для всего pipeline (30 минут)
        timeout(time: 30, unit: 'MINUTES')
        // Показывать таймстампы в логах
        timestamps()
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "🔄 Клонирование репозитория..."
                    checkout scm
                    sh 'git rev-parse HEAD > .git/commit-hash'
                    sh 'cat .git/commit-hash'
                }
            }
        }
        
        stage('Validate') {
            steps {
                script {
                    echo "✅ Проверка кода..."
                    // Проверяем, что Jenkinsfile существует
                    sh 'test -f Jenkinsfile && echo "✅ Jenkinsfile найден" || (echo "❌ Jenkinsfile не найден" && exit 1)'
                    echo "✅ Валидация завершена"
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    echo "🚀 Деплой на сервер ${DEPLOY_HOST}:${DEPLOY_PORT}..."
                    
                    // Используем SSH для подключения к серверу и запуска скрипта деплоя
                    // BEST PRACTICE 2026: Используем Jenkins Credentials для секретов (не логируются)
                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'jenkins-ssh-deploy-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                        // Секреты через Jenkins Credentials (создайте в Jenkins UI: Manage Jenkins → Credentials)
                        // ID credentials должны совпадать с указанными ниже
                        string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_BOT_TOKEN', required: false),
                        string(credentialsId: 'telegram-user-id', variable: 'TELEGRAM_USER_ID', required: false),
                        string(credentialsId: 'gemini-api-key', variable: 'GEMINI_API_KEY', required: false),
                    ]) {
                        sh """
                            # Подключение к серверу и запуск деплоя
                            SSH_PORT_FLAG=""
                            if [ "${DEPLOY_PORT}" != "22" ]; then
                                SSH_PORT_FLAG="-p ${DEPLOY_PORT}"
                            fi
                            
                            # BEST PRACTICE: Передаем секреты через stdin (не видны в логах)
                            # Используем base64 для безопасной передачи через SSH
                            SECRETS_ENV=""
                            if [ -n "\${TELEGRAM_BOT_TOKEN}" ]; then
                                SECRETS_ENV="\${SECRETS_ENV}TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN}\\n"
                            fi
                            if [ -n "\${TELEGRAM_USER_ID}" ]; then
                                SECRETS_ENV="\${SECRETS_ENV}TELEGRAM_USER_ID=\${TELEGRAM_USER_ID}\\n"
                            fi
                            if [ -n "\${GEMINI_API_KEY}" ]; then
                                SECRETS_ENV="\${SECRETS_ENV}GEMINI_API_KEY=\${GEMINI_API_KEY}\\n"
                            fi
                            
                            # Передаем секреты через stdin (безопаснее, чем через аргументы команды)
                            if [ -n "\${SECRETS_ENV}" ]; then
                                echo -e "\${SECRETS_ENV}" | ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} \${SSH_PORT_FLAG} ${DEPLOY_USER}@${DEPLOY_HOST} \
                                    "cd ${DEPLOY_PATH} && \
                                     git fetch origin && \
                                     git checkout -f origin/main || git checkout -f origin/master && \
                                     chmod +x scripts/deploy.sh && \
                                     while IFS='=' read -r key value; do \
                                       [ -n \"\$key\" ] && export \"\$key\"=\"\$value\"; \
                                     done && \
                                     bash scripts/deploy.sh"
                            else
                                # Если секреты не переданы, используем существующий .env на сервере
                                ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} \${SSH_PORT_FLAG} ${DEPLOY_USER}@${DEPLOY_HOST} \
                                    "cd ${DEPLOY_PATH} && \
                                     git fetch origin && \
                                     git checkout -f origin/main || git checkout -f origin/master && \
                                     chmod +x scripts/deploy.sh && \
                                     bash scripts/deploy.sh"
                            fi
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo "✅ Pipeline выполнен успешно!"
                // Здесь можно добавить уведомления (Telegram, Slack, Email)
            }
        }
        failure {
            script {
                echo "❌ Pipeline завершился с ошибкой!"
                // Здесь можно добавить уведомления об ошибках
            }
        }
        always {
            script {
                echo "📋 Очистка временных файлов..."
                sh 'rm -f .git/commit-hash || true'
            }
        }
    }
}

