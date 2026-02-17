#!/bin/bash
# Скрипт автоматической проверки настройки

echo "=== ПРОВЕРКА НАСТРОЙКИ УПРАВЛЕНИЯ ДИСКОМ ==="
echo ""

# 1. Проверка cron задач
echo "1. Проверка cron задач..."
CRON_COUNT=$(crontab -l 2>/dev/null | grep -cE "disk-monitor|docker-cleanup|tmp-cleanup" || echo "0")
if [ "$CRON_COUNT" -ge 3 ]; then
    echo "  ✓ Cron задачи настроены ($CRON_COUNT найдено)"
    crontab -l 2>/dev/null | grep -E "disk-monitor|docker-cleanup|tmp-cleanup" | sed 's/^/    /'
else
    echo "  ✗ Cron задачи не настроены (найдено: $CRON_COUNT)"
fi

# 2. Проверка скриптов
echo ""
echo "2. Проверка скриптов..."
SCRIPTS=(
    "/usr/local/bin/disk-monitor.sh"
    "/usr/local/bin/docker-cleanup.sh"
    "/usr/local/bin/tmp-cleanup.sh"
    "/usr/local/bin/cleanup-disk.sh"
)
ALL_EXIST=true
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo "  ✓ $script"
    else
        echo "  ✗ $script (не найден или не исполняемый)"
        ALL_EXIST=false
    fi
done

# 3. Проверка logrotate
echo ""
echo "3. Проверка logrotate..."
if [ -f "/etc/logrotate.d/custom-logs" ]; then
    echo "  ✓ /etc/logrotate.d/custom-logs настроен"
else
    echo "  ✗ /etc/logrotate.d/custom-logs не найден"
fi

# 4. Проверка systemd journal
echo ""
echo "4. Проверка systemd journal..."
if grep -q "^SystemMaxUse=500M" /etc/systemd/journald.conf 2>/dev/null; then
    echo "  ✓ Systemd journal настроен"
else
    echo "  ✗ Systemd journal не настроен"
fi

# 5. Проверка логов
echo ""
echo "5. Проверка логов..."
LOGS=(
    "/var/log/disk-monitor.log"
    "/var/log/docker-cleanup.log"
    "/var/log/tmp-cleanup.log"
)
for log in "${LOGS[@]}"; do
    if [ -f "$log" ]; then
        SIZE=$(stat -c%s "$log" 2>/dev/null || stat -f%z "$log" 2>/dev/null || echo "0")
        echo "  ✓ $log (размер: $SIZE байт)"
    else
        echo "  ⚠️  $log (еще не создан, будет создан при первом запуске)"
    fi
done

# 6. Тест мониторинга
echo ""
echo "6. Тест мониторинга..."
if [ -f "/usr/local/bin/disk-monitor.sh" ]; then
    if sudo /usr/local/bin/disk-monitor.sh 2>/dev/null; then
        echo "  ✓ Мониторинг работает"
    else
        echo "  ✗ Ошибка при запуске мониторинга"
    fi
else
    echo "  ✗ Скрипт мониторинга не найден"
fi

# 7. Использование диска
echo ""
echo "7. Текущее использование диска:"
df -h / | tail -1

echo ""
echo "=== ПРОВЕРКА ЗАВЕРШЕНА ==="
