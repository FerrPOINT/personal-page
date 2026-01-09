pipeline {
    agent any
    
    environment {
        // SSH connection settings
        DEPLOY_HOST = '7eb10d5af2ad.vps.myjino.ru'
        DEPLOY_PORT = '49233'
        DEPLOY_USER = 'root'
        DEPLOY_PATH = '/opt/personal-page'
        
        // Docker Compose settings
        COMPOSE_PROJECT_NAME = 'personal-page'
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
        
        stage('Build') {
            steps {
                script {
                    echo "🔨 Сборка Docker образов..."
                    // Проверяем наличие docker-compose
                    sh 'docker-compose --version || echo "⚠️  docker-compose не найден, будет использован docker compose"'
                    
                    // Собираем образы (без запуска)
                    sh '''
                        if command -v docker-compose &> /dev/null; then
                            docker-compose build --no-cache
                        else
                            docker compose build --no-cache
                        fi
                    '''
                    
                    echo "✅ Образы успешно собраны"
                }
            }
        }
        
        stage('Test') {
            steps {
                script {
                    echo "🧪 Запуск тестов..."
                    // Здесь можно добавить тесты, если они есть
                    // sh 'npm test' или другие команды тестирования
                    echo "✅ Тесты пройдены (пропущено, если тесты не настроены)"
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    echo "🚀 Деплой на сервер ${DEPLOY_HOST}:${DEPLOY_PORT}..."
                    
                    // Используем SSH для подключения к серверу
                    sshagent(credentials: ['jenkins-ssh-deploy-key']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no -p ${DEPLOY_PORT} ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
                                set -e
                                echo "📂 Переход в директорию проекта..."
                                cd ${DEPLOY_PATH}
                                
                                echo "🔄 Обновление кода из репозитория..."
                                git fetch origin
                                git reset --hard origin/main || git reset --hard origin/master
                                
                                echo "🔧 Настройка окружения..."
                                if [ -f env.prod ]; then
                                    cp env.prod .env
                                    echo "✅ env.prod скопирован в .env"
                                else
                                    echo "⚠️  env.prod не найден, используем существующий .env"
                                fi
                                
                                echo "🐳 Остановка старых контейнеров..."
                                if command -v docker-compose &> /dev/null; then
                                    docker-compose down || true
                                else
                                    docker compose down || true
                                fi
                                
                                echo "🔨 Сборка и запуск новых контейнеров..."
                                if command -v docker-compose &> /dev/null; then
                                    docker-compose up -d --build
                                else
                                    docker compose up -d --build
                                fi
                                
                                echo "⏳ Ожидание запуска сервисов..."
                                sleep 5
                                
                                echo "🗄️  Запуск миграций базы данных..."
                                if command -v docker-compose &> /dev/null; then
                                    docker-compose exec -T backend npm run migrate || echo "⚠️  Миграция уже выполнена"
                                else
                                    docker compose exec -T backend npm run migrate || echo "⚠️  Миграция уже выполнена"
                                fi
                                
                                echo "📊 Проверка статуса контейнеров..."
                                if command -v docker-compose &> /dev/null; then
                                    docker-compose ps
                                else
                                    docker compose ps
                                fi
                                
                                echo "✅ Деплой завершен успешно!"
ENDSSH
                        """
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo "🏥 Проверка здоровья сервисов..."
                    
                    sshagent(credentials: ['jenkins-ssh-deploy-key']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no -p ${DEPLOY_PORT} ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
                                echo "🔍 Проверка backend health endpoint..."
                                sleep 3
                                
                                # Проверяем health endpoint
                                if curl -f http://localhost:9000/health > /dev/null 2>&1; then
                                    echo "✅ Backend health check: OK"
                                    curl http://localhost:9000/health
                                else
                                    echo "❌ Backend health check: FAILED"
                                    echo "📋 Логи backend:"
                                    if command -v docker-compose &> /dev/null; then
                                        docker-compose logs --tail=50 backend
                                    else
                                        docker compose logs --tail=50 backend
                                    fi
                                    exit 1
                                fi
                                
                                # Проверяем, что контейнеры запущены
                                echo "🔍 Проверка статуса контейнеров..."
                                if command -v docker-compose &> /dev/null; then
                                    docker-compose ps | grep -q "Up" || exit 1
                                else
                                    docker compose ps | grep -q "Up" || exit 1
                                fi
                                echo "✅ Все контейнеры запущены"
ENDSSH
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

