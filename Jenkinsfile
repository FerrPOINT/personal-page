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
                    // Передаем секреты через переменные окружения (если настроены в Jenkins Credentials)
                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'jenkins-ssh-deploy-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                        // Опционально: можно добавить секреты через string credentials
                        // string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_BOT_TOKEN'),
                        // string(credentialsId: 'telegram-user-id', variable: 'TELEGRAM_USER_ID'),
                    ]) {
                        sh """
                            # Подключение к серверу и запуск деплоя
                            SSH_PORT_FLAG=""
                            if [ "${DEPLOY_PORT}" != "22" ]; then
                                SSH_PORT_FLAG="-p ${DEPLOY_PORT}"
                            fi
                            
                            # Экспортируем секреты для передачи в скрипт деплоя (если они установлены)
                            export TELEGRAM_BOT_TOKEN="${env.TELEGRAM_BOT_TOKEN ?: ''}"
                            export TELEGRAM_USER_ID="${env.TELEGRAM_USER_ID ?: ''}"
                            export GEMINI_API_KEY="${env.GEMINI_API_KEY ?: ''}"
                            
                            ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} \${SSH_PORT_FLAG} ${DEPLOY_USER}@${DEPLOY_HOST} \
                                "cd ${DEPLOY_PATH} && \
                                 git fetch origin && \
                                 git checkout -f origin/main || git checkout -f origin/master && \
                                 chmod +x scripts/deploy.sh && \
                                 TELEGRAM_BOT_TOKEN='${env.TELEGRAM_BOT_TOKEN ?: ''}' \
                                 TELEGRAM_USER_ID='${env.TELEGRAM_USER_ID ?: ''}' \
                                 GEMINI_API_KEY='${env.GEMINI_API_KEY ?: ''}' \
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

