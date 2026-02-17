#!/bin/bash
# Главный скрипт для управления дисковым пространством на сервере
# Использование: ./disk-manager.sh [diagnose|setup|cleanup|status]

set +e  # Не прерывать выполнение при ошибках

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIAGNOSE_SCRIPT="$SCRIPT_DIR/diagnose-disk-usage.sh"
PREVENT_SCRIPT="$SCRIPT_DIR/prevent-disk-full.sh"
CLEANUP_SCRIPT="/usr/local/bin/cleanup-disk.sh"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция вывода справки
show_help() {
    echo -e "${BLUE}Управление дисковым пространством на сервере${NC}"
    echo ""
    echo "Использование: $0 [команда]"
    echo ""
    echo "Команды:"
    echo "  ${GREEN}diagnose${NC}    - Диагностика использования диска (безопасно, только чтение)"
    echo "  ${GREEN}setup${NC}       - Настройка автоматической защиты от переполнения (требует root)"
    echo "  ${GREEN}cleanup${NC}     - Ручная очистка диска (требует root)"
    echo "  ${GREEN}status${NC}      - Проверка статуса мониторинга и cron задач"
    echo "  ${GREEN}help${NC}        - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 diagnose              # Диагностика (безопасно)"
    echo "  sudo $0 setup            # Настройка автоматической защиты"
    echo "  sudo $0 cleanup          # Ручная очистка"
    echo "  $0 status                # Проверка статуса"
}

# Функция диагностики
run_diagnose() {
    echo -e "${BLUE}=== ДИАГНОСТИКА ИСПОЛЬЗОВАНИЯ ДИСКА ===${NC}"
    echo ""
    
    if [ ! -f "$DIAGNOSE_SCRIPT" ]; then
        echo -e "${RED}❌ Скрипт диагностики не найден: $DIAGNOSE_SCRIPT${NC}"
        return 1
    fi
    
    if [ ! -x "$DIAGNOSE_SCRIPT" ]; then
        chmod +x "$DIAGNOSE_SCRIPT"
    fi
    
    "$DIAGNOSE_SCRIPT"
    
    echo ""
    echo -e "${GREEN}✓ Диагностика завершена${NC}"
}

# Функция настройки
run_setup() {
    echo -e "${BLUE}=== НАСТРОЙКА АВТОМАТИЧЕСКОЙ ЗАЩИТЫ ОТ ПЕРЕПОЛНЕНИЯ ===${NC}"
    echo ""
    
    # Проверка прав root
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Этот скрипт требует прав root${NC}"
        echo "Запустите: sudo $0 setup"
        return 1
    fi
    
    if [ ! -f "$PREVENT_SCRIPT" ]; then
        echo -e "${RED}❌ Скрипт настройки не найден: $PREVENT_SCRIPT${NC}"
        return 1
    fi
    
    if [ ! -x "$PREVENT_SCRIPT" ]; then
        chmod +x "$PREVENT_SCRIPT"
    fi
    
    echo -e "${YELLOW}⚠️  Этот скрипт настроит:${NC}"
    echo "  - Автоматическую ротацию логов (logrotate)"
    echo "  - Еженедельную очистку Docker"
    echo "  - Ежедневную очистку временных файлов"
    echo "  - Мониторинг диска каждые 30 минут"
    echo "  - Ограничения для systemd journal"
    echo ""
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Отменено"
        return 1
    fi
    
    "$PREVENT_SCRIPT"
    
    echo ""
    echo -e "${GREEN}✓ Настройка завершена${NC}"
    echo ""
    echo "Проверьте статус: $0 status"
}

# Функция очистки
run_cleanup() {
    echo -e "${BLUE}=== РУЧНАЯ ОЧИСТКА ДИСКА ===${NC}"
    echo ""
    
    # Проверка прав root
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Этот скрипт требует прав root${NC}"
        echo "Запустите: sudo $0 cleanup"
        return 1
    fi
    
    if [ ! -f "$CLEANUP_SCRIPT" ]; then
        echo -e "${YELLOW}⚠️  Скрипт очистки не найден. Запустите сначала: $0 setup${NC}"
        return 1
    fi
    
    if [ ! -x "$CLEANUP_SCRIPT" ]; then
        chmod +x "$CLEANUP_SCRIPT"
    fi
    
    "$CLEANUP_SCRIPT"
}

# Функция проверки статуса
run_status() {
    echo -e "${BLUE}=== СТАТУС МОНИТОРИНГА И НАСТРОЕК ===${NC}"
    echo ""
    
    # Использование диска
    echo -e "${GREEN}Использование диска:${NC}"
    df -h / | tail -1
    
    # Проверка cron задач
    echo ""
    echo -e "${GREEN}Cron задачи:${NC}"
    if crontab -l 2>/dev/null | grep -q "disk-monitor\|docker-cleanup\|tmp-cleanup"; then
        crontab -l 2>/dev/null | grep -E "disk-monitor|docker-cleanup|tmp-cleanup" | while read line; do
            echo "  ✓ $line"
        done
    else
        echo -e "  ${YELLOW}⚠️  Cron задачи не найдены. Запустите: sudo $0 setup${NC}"
    fi
    
    # Проверка скриптов
    echo ""
    echo -e "${GREEN}Скрипты:${NC}"
    for script in "/usr/local/bin/disk-monitor.sh" "/usr/local/bin/docker-cleanup.sh" "/usr/local/bin/tmp-cleanup.sh" "/usr/local/bin/cleanup-disk.sh"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                echo -e "  ${GREEN}✓${NC} $script (исполняемый)"
            else
                echo -e "  ${YELLOW}⚠️${NC} $script (не исполняемый)"
            fi
        else
            echo -e "  ${RED}✗${NC} $script (не найден)"
        fi
    done
    
    # Проверка logrotate
    echo ""
    echo -e "${GREEN}Logrotate:${NC}"
    if [ -f "/etc/logrotate.d/custom-logs" ]; then
        echo -e "  ${GREEN}✓${NC} /etc/logrotate.d/custom-logs настроен"
    else
        echo -e "  ${YELLOW}⚠️${NC} Logrotate не настроен. Запустите: sudo $0 setup"
    fi
    
    # Последние логи мониторинга
    echo ""
    echo -e "${GREEN}Последние логи мониторинга:${NC}"
    if [ -f "/var/log/disk-monitor.log" ]; then
        tail -5 /var/log/disk-monitor.log 2>/dev/null || echo "  (лог пуст или недоступен)"
    else
        echo "  (лог не найден)"
    fi
}

# Главная логика
case "${1:-help}" in
    diagnose)
        run_diagnose
        ;;
    setup)
        run_setup
        ;;
    cleanup)
        run_cleanup
        ;;
    status)
        run_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Неизвестная команда: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

