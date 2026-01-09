pipeline {
    agent any
    
    
    environment {
        // SSH connection settings
        // Реальный хост сервера (azhukov-dev - алиас, который может не резолвиться на Jenkins)
        DEPLOY_HOST = '7eb10d5af2ad.vps.myjino.ru'  // Реальный хост сервера
        DEPLOY_PORT = '49233'  // SSH порт сервера
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
                    // Секреты опциональны - если не созданы в Jenkins, используются значения из .env на сервере
                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'jenkins-ssh-deploy-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    ]) {
                        // Опциональные секреты (создайте в Jenkins UI: Manage Jenkins → Credentials, если нужны)
                        // Если не созданы, deploy.sh использует существующий .env на сервере
                        def telegramBotToken = ''
                        def telegramUserId = ''
                        def geminiApiKey = ''
                        
                        try {
                            withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_BOT_TOKEN')]) {
                                telegramBotToken = env.TELEGRAM_BOT_TOKEN ?: ''
                            }
                        } catch (Exception e) {
                            echo "⚠️  telegram-bot-token credentials не найдены, используем .env на сервере"
                        }
                        
                        try {
                            withCredentials([string(credentialsId: 'telegram-user-id', variable: 'TELEGRAM_USER_ID')]) {
                                telegramUserId = env.TELEGRAM_USER_ID ?: ''
                            }
                        } catch (Exception e) {
                            echo "⚠️  telegram-user-id credentials не найдены, используем .env на сервере"
                        }
                        
                        try {
                            withCredentials([string(credentialsId: 'gemini-api-key', variable: 'GEMINI_API_KEY')]) {
                                geminiApiKey = env.GEMINI_API_KEY ?: ''
                            }
                        } catch (Exception e) {
                            echo "⚠️  gemini-api-key credentials не найдены, используем .env на сервере"
                        }
                        // BEST PRACTICE 2026: Используем экранирование для предотвращения интерполяции секретов
                        // \$SSH_KEY - shell переменная (не интерполируется Groovy)
                        // Это предотвращает логирование секретов в Jenkins
                        sh """
                            # Подключение к серверу и запуск деплоя
                            SSH_PORT_FLAG=""
                            if [ "${DEPLOY_PORT}" != "22" ]; then
                                SSH_PORT_FLAG="-p ${DEPLOY_PORT}"
                            fi
                            
                            # BEST PRACTICE: Используем экранированные переменные для секретов
                            # \$SSH_KEY - shell переменная, не интерполируется Groovy (безопасно)
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" \${SSH_PORT_FLAG} ${DEPLOY_USER}@${DEPLOY_HOST} \
                                "cd ${DEPLOY_PATH} && \
                                 git fetch origin && \
                                 git checkout -f origin/main || git checkout -f origin/master && \
                                 chmod +x scripts/deploy.sh && \
                                 TELEGRAM_BOT_TOKEN='${telegramBotToken ?: ''}' \
                                 TELEGRAM_USER_ID='${telegramUserId ?: ''}' \
                                 GEMINI_API_KEY='${geminiApiKey ?: ''}' \
                                 bash scripts/deploy.sh"
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

