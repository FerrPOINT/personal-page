#!/bin/bash
# Скрипт мониторинга и автоматического восстановления приложения
# Запускать через cron каждые 5 минут: */5 * * * * /opt/personal-page/monitor.sh

set -e

DEPLOY_PATH="${DEPLOY_PATH:-/opt/personal-page}"
LOG_DIR="${LOG_DIR:-/var/log}"
LOG_FILE="${LOG_FILE:-$LOG_DIR/personal-page-monitor.log}"
ALERT_EMAIL=""  # Опционально: email для уведомлений

# Создаем директорию для логов если её нет
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Функция проверки контейнеров
check_containers() {
    # Если DEPLOY_PATH не существует, пробуем текущую директорию
    if [ ! -d "$DEPLOY_PATH" ]; then
        # Пробуем найти docker-compose.yml в текущей директории или родительской
        if [ -f "docker-compose.yml" ] || [ -f "../docker-compose.yml" ]; then
            DEPLOY_PATH="."
        else
            log "❌ Директория $DEPLOY_PATH не найдена и docker-compose.yml не найден"
            return 1
        fi
    fi
    cd "$DEPLOY_PATH" || return 1
    
    # Проверяем статус контейнеров
    if ! docker compose ps | grep -q "Up"; then
        log "❌ Обнаружены остановленные контейнеры"
        return 1
    fi
    
    # Проверяем health backend
    if ! curl -f -s http://localhost:9000/health > /dev/null 2>&1; then
        log "❌ Backend health check failed"
        return 1
    fi
    
    # Проверяем доступность frontend
    if ! curl -f -s http://localhost:8888 > /dev/null 2>&1; then
        log "❌ Frontend недоступен"
        return 1
    fi
    
    return 0
}

# Функция восстановления
restart_services() {
    log "🔄 Попытка восстановления сервисов..."
    # Если DEPLOY_PATH не существует, пробуем текущую директорию
    if [ ! -d "$DEPLOY_PATH" ]; then
        if [ -f "docker-compose.yml" ] || [ -f "../docker-compose.yml" ]; then
            DEPLOY_PATH="."
        else
            log "❌ Директория $DEPLOY_PATH не найдена"
            return 1
        fi
    fi
    cd "$DEPLOY_PATH" || return 1
    
    # Перезапускаем контейнеры
    docker compose restart || {
        log "⚠️  Перезапуск не помог, пересобираем..."
        docker compose up -d --build
    }
    
    # Ждем запуска
    sleep 10
    
    # Проверяем результат
    if check_containers; then
        log "✅ Сервисы восстановлены успешно"
        return 0
    else
        log "❌ Не удалось восстановить сервисы"
        return 1
    fi
}

# Основная логика
main() {
    log "🔍 Начало проверки..."
    
    if check_containers; then
        log "✅ Все сервисы работают нормально"
        exit 0
    else
        log "⚠️  Обнаружена проблема, запускаем восстановление..."
        if restart_services; then
            log "✅ Проблема решена автоматически"
            exit 0
        else
            log "❌ КРИТИЧНО: Не удалось восстановить сервисы автоматически!"
            # Здесь можно добавить отправку уведомлений (Telegram, Email, etc.)
            exit 1
        fi
    fi
}

main

