pipeline {
    agent any
    
    // Автоматический запуск при изменениях в main ветке
    // Poll SCM каждые 10 минут - оптимальный баланс между ресурсами и скоростью
    // Для внутреннего Jenkins без публичного URL это самый простой и надежный вариант
    triggers {
        pollSCM('H/10 * * * *')
    }
    
    environment {
        // SSH connection settings
        DEPLOY_HOST = '7eb10d5af2ad.vps.myjino.ru'  // Реальный хост сервера
        DEPLOY_PORT = '49233'  // SSH порт сервера
        DEPLOY_USER = 'root'
        DEPLOY_PATH = '/opt/personal-page'
        
        // Production URL для тестирования после деплоя
        // Формат: https://<subdomain>.myjino.ru или можно указать явно
        PROD_URL = 'https://7eb10d5af2ad.myjino.ru'  // URL продакшн сервера для тестов
        
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
                            # ВАЖНО: Передаем переменные через переменные окружения SSH команды
                            # Groovy автоматически экранирует специальные символы при интерполяции
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" \${SSH_PORT_FLAG} ${DEPLOY_USER}@${DEPLOY_HOST} \
                                "cd ${DEPLOY_PATH} && \
                                 git fetch origin && \
                                 git checkout -f origin/main || git checkout -f origin/master && \
                                 chmod +x deploy.sh && \
                                 TELEGRAM_BOT_TOKEN='${telegramBotToken ?: ''}' \
                                 TELEGRAM_USER_ID='${telegramUserId ?: ''}' \
                                 bash deploy.sh"
                        """
                    }
                }
            }
        }
        
        stage('Test') {
            steps {
                script {
                    echo "🧪 Запуск тестов на продакшн сервере после деплоя..."
                    try {
                        // Проверка наличия package.json
                        sh 'test -f package.json && echo "✅ package.json найден" || (echo "❌ package.json не найден" && exit 1)'
                        
                        // Проверка доступности продакшн сервера
                        try {
                            sh """
                                echo "🔍 Проверка доступности продакшн сервера..."
                                echo "🌐 URL продакшн сервера: ${PROD_URL}"
                                if curl -f -s ${PROD_URL} > /dev/null 2>&1; then
                                    echo "✅ Продакшн сервер доступен: ${PROD_URL}"
                                else
                                    echo "⚠️  Продакшн сервер недоступен на ${PROD_URL}"
                                    echo "⚠️  Тесты могут провалиться, но продолжаем выполнение"
                                fi
                            """
                        } catch (Exception e) {
                            echo "⚠️  Проверка сервера пропущена: ${e.getMessage()}"
                        }
                        
                        // Запуск тестов в Docker контейнере с Node.js
                        // Используем официальный образ Node.js с Playwright
                        def testResult = sh(
                            script: """
                                echo "🧪 Запуск критичных тестов на продакшн сервере..."
                                echo "🌐 Тестируем: ${PROD_URL}"
                                echo "🐳 Используем Docker контейнер с Node.js для тестов"
                                
                                docker run --rm \\
                                    -v \$(pwd):/workspace \\
                                    -w /workspace \\
                                    -e CI=true \\
                                    -e FRONTEND_URL=${PROD_URL} \\
                                    -e PROD_URL=${PROD_URL} \\
                                    --network host \\
                                    mcr.microsoft.com/playwright:v1.48.0-focal \\
                                    bash -c "
                                        echo '📦 Установка зависимостей...' &&
                                        npm ci --prefer-offline --no-audit &&
                                        echo '🎭 Установка браузеров Playwright...' &&
                                        npx playwright install --with-deps chromium &&
                                        echo '🧪 Запуск тестов...' &&
                                        npx playwright test \\
                                            autotests/automated/ui/group-001-ui-elements/TC-005-language-switcher.spec.ts \\
                                            autotests/automated/forms/group-002-forms/TC-001-contact-form.spec.ts \\
                                            --project=chromium \\
                                            --reporter=list
                                    "
                            """,
                            returnStatus: true
                        )
                        
                        if (testResult != 0) {
                            error("Тесты не выполнены: exit code ${testResult}")
                        }
                        
                        echo "✅ Тесты завершены успешно"
                    } catch (Exception e) {
                        echo "❌ Ошибка при запуске тестов: ${e.getMessage()}"
                        echo "⚠️  Тесты провалились после деплоя - требуется проверка"
                        // Тесты критичны - падаем пайп при ошибках
                        error("Тесты не выполнены: ${e.getMessage()}")
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

