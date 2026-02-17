#!/bin/bash
# Скрипт для предотвращения переполнения диска
# Настройка ротации логов, очистки старых файлов, мониторинга

# Не прерывать выполнение при ошибках (многие команды могут не сработать на разных системах)
set +e

echo "=== НАСТРОЙКА ПРЕДОТВРАЩЕНИЯ ПЕРЕПОЛНЕНИЯ ДИСКА ==="

# 1. Настройка logrotate для автоматической ротации логов
echo -e "\n1. Настройка logrotate..."

if [ -f /etc/logrotate.conf ]; then
    # Создаем конфигурацию для всех логов
    cat > /etc/logrotate.d/custom-logs << 'EOF'
# Ротация всех логов в /var/log
/var/log/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0644 root root
    sharedscripts
    postrotate
        systemctl reload rsyslog >/dev/null 2>&1 || true
    endscript
}

# Ротация системных логов
/var/log/syslog {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0644 syslog adm
    postrotate
        systemctl reload rsyslog >/dev/null 2>&1 || true
    endscript
}

# Ротация auth.log
/var/log/auth.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0644 syslog adm
    postrotate
        systemctl reload rsyslog >/dev/null 2>&1 || true
    endscript
}
EOF
    echo "✓ logrotate настроен"
else
    echo "⚠ logrotate не найден, пропускаем"
fi

# 2. Очистка старых логов (>30 дней)
echo -e "\n2. Очистка старых логов (>30 дней)..."
find /var/log -type f -name "*.log.*" -mtime +30 -delete 2>/dev/null
find /var/log -type f -name "*.gz" -mtime +30 -delete 2>/dev/null
echo "✓ Старые логи очищены"

# 2.1. Очистка Docker при setup (если установлен)
if command -v docker &> /dev/null; then
    echo -e "\n2.1. Очистка Docker (только неиспользуемые ресурсы)..."
    echo "   Удаление dangling образов (неиспользуемые)..."
    docker image prune -f 2>/dev/null || true
    echo "   Удаление остановленных контейнеров (неиспользуемые)..."
    docker container prune -f 2>/dev/null || true
    echo "   Очистка build cache (неиспользуемый кэш)..."
    docker builder prune -af 2>/dev/null || true
    echo "   Полная очистка неиспользуемых ресурсов (работающие контейнеры НЕ удаляются)..."
    docker system prune -af 2>/dev/null || true
    echo "✓ Docker очищен"
fi

# 3. Настройка очистки Docker (если установлен)
echo -e "\n3. Настройка очистки Docker..."
if command -v docker &> /dev/null; then
    # Создаем скрипт для очистки Docker
    cat > /usr/local/bin/docker-cleanup.sh << 'EOF'
#!/bin/bash
# Агрессивная очистка неиспользуемых Docker ресурсов

echo "=== ОЧИСТКА DOCKER ==="
echo "Размер до очистки:"
docker system df 2>/dev/null || true
echo ""

echo "1. Удаление dangling образов (без тегов, неиспользуемые)..."
docker image prune -f 2>/dev/null || true

echo "2. Удаление остановленных контейнеров (неиспользуемые)..."
docker container prune -f 2>/dev/null || true

echo "3. Удаление неиспользуемых volumes (dangling, не подключенные к контейнерам)..."
docker volume prune -f 2>/dev/null || true

echo "4. Очистка build cache (неиспользуемый кэш сборки)..."
docker builder prune -af 2>/dev/null || true

echo "5. Удаление неиспользуемых образов старше 7 дней (не используются контейнерами)..."
docker image prune -af --filter "until=168h" 2>/dev/null || true

echo "6. Полная очистка неиспользуемых ресурсов (работающие контейнеры и их образы НЕ удаляются)..."
docker system prune -af 2>/dev/null || true

echo ""
echo "Размер после очистки:"
docker system df 2>/dev/null || true
echo "✓ Очистка Docker завершена"
EOF
    chmod +x /usr/local/bin/docker-cleanup.sh
    echo "✓ Скрипт очистки Docker создан"
    
    # Добавляем в cron (еженедельно)
    (crontab -l 2>/dev/null | grep -v "docker-cleanup" || true; echo "0 3 * * 0 /usr/local/bin/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1") | crontab - 2>/dev/null || true
    echo "✓ Cron задача для очистки Docker добавлена (каждое воскресенье в 3:00)"
else
    echo "⚠ Docker не установлен, пропускаем"
fi

# 4. Очистка временных файлов
echo -e "\n4. Настройка очистки временных файлов..."
cat > /usr/local/bin/tmp-cleanup.sh << 'EOF'
#!/bin/bash
# Очистка временных файлов старше 7 дней
find /tmp -type f -mtime +7 -delete 2>/dev/null
find /var/tmp -type f -mtime +7 -delete 2>/dev/null
find /var/cache -type f -mtime +30 -delete 2>/dev/null
EOF
chmod +x /usr/local/bin/tmp-cleanup.sh
(crontab -l 2>/dev/null | grep -v "tmp-cleanup" || true; echo "0 2 * * * /usr/local/bin/tmp-cleanup.sh >> /var/log/tmp-cleanup.log 2>&1") | crontab - 2>/dev/null || true
echo "✓ Cron задача для очистки временных файлов добавлена (ежедневно в 2:00)"

# 5. Мониторинг использования диска с алертами
echo -e "\n5. Настройка мониторинга диска..."
cat > /usr/local/bin/disk-monitor.sh << 'EOF'
#!/bin/bash
# Мониторинг использования диска с алертами

THRESHOLD=85  # Процент использования диска для предупреждения
CRITICAL=95   # Критический уровень

DISK_USAGE=$(df / 2>/dev/null | awk 'NR==2 {gsub(/%/, "", $5); print $5}' || echo "0")

# Проверка, что DISK_USAGE - это число
if ! [[ "$DISK_USAGE" =~ ^[0-9]+$ ]]; then
    DISK_USAGE=0
fi

if [ "$DISK_USAGE" -ge "$CRITICAL" ]; then
    echo "CRITICAL: Disk usage is ${DISK_USAGE}% - CRITICAL LEVEL!" | logger -t disk-monitor -p crit 2>/dev/null || true
    # Можно добавить отправку email или уведомление
elif [ "$DISK_USAGE" -ge "$THRESHOLD" ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}% - above threshold" | logger -t disk-monitor -p warning 2>/dev/null || true
fi

# Автоматическая очистка при критическом уровне
if [ "$DISK_USAGE" -ge "$CRITICAL" ]; then
    echo "Running emergency cleanup..." | logger -t disk-monitor 2>/dev/null || true
    # Очистка старых логов
    find /var/log -type f -name "*.log.*" -mtime +7 -delete 2>/dev/null || true
    find /var/log -type f -name "*.gz" -mtime +7 -delete 2>/dev/null || true
    
    # Очистка Docker (если установлен)
    if command -v docker &> /dev/null; then
        # Только неиспользуемые ресурсы - работающие контейнеры и их образы НЕ удаляются
        docker image prune -f 2>/dev/null || true
        docker container prune -f 2>/dev/null || true
        docker builder prune -af 2>/dev/null || true
        docker system prune -af 2>/dev/null || true
    fi
    
    # Очистка временных файлов
    find /tmp -type f -mtime +3 -delete 2>/dev/null || true
    find /var/tmp -type f -mtime +3 -delete 2>/dev/null || true
fi
EOF
chmod +x /usr/local/bin/disk-monitor.sh
(crontab -l 2>/dev/null | grep -v "disk-monitor" || true; echo "*/30 * * * * /usr/local/bin/disk-monitor.sh >> /var/log/disk-monitor.log 2>&1") | crontab - 2>/dev/null || true
echo "✓ Мониторинг диска настроен (проверка каждые 30 минут)"

# 6. Очистка старых ядер (если есть)
echo -e "\n6. Проверка старых ядер..."
if [ -d /boot ] && command -v dpkg &> /dev/null; then
    CURRENT_KERNEL=$(uname -r)
    OLD_KERNELS=$(dpkg -l 2>/dev/null | grep -E 'linux-image-[0-9]' | grep -v "$CURRENT_KERNEL" | awk '{print $2}' || true)
    if [ -n "$OLD_KERNELS" ]; then
        echo "Найдены старые ядра: $OLD_KERNELS"
        echo "Для удаления выполните: apt-get purge $OLD_KERNELS"
    else
        echo "✓ Старых ядер не найдено"
    fi
else
    echo "⚠ dpkg не найден или /boot недоступен, пропускаем"
fi

# 7. Настройка journald (systemd logs)
echo -e "\n7. Настройка journald..."
if [ -f /etc/systemd/journald.conf ]; then
    # Резервная копия
    cp /etc/systemd/journald.conf /etc/systemd/journald.conf.bak 2>/dev/null || true
    
    # Настройка ограничений (только если параметры не установлены)
    if ! grep -q "^SystemMaxUse=" /etc/systemd/journald.conf; then
        sed -i '/^#SystemMaxUse=/a SystemMaxUse=500M' /etc/systemd/journald.conf || \
        echo "SystemMaxUse=500M" >> /etc/systemd/journald.conf
    fi
    if ! grep -q "^SystemKeepFree=" /etc/systemd/journald.conf; then
        sed -i '/^#SystemKeepFree=/a SystemKeepFree=1G' /etc/systemd/journald.conf || \
        echo "SystemKeepFree=1G" >> /etc/systemd/journald.conf
    fi
    if ! grep -q "^SystemMaxFileSize=" /etc/systemd/journald.conf; then
        sed -i '/^#SystemMaxFileSize=/a SystemMaxFileSize=100M' /etc/systemd/journald.conf || \
        echo "SystemMaxFileSize=100M" >> /etc/systemd/journald.conf
    fi
    if ! grep -q "^MaxRetentionSec=" /etc/systemd/journald.conf; then
        sed -i '/^#MaxRetentionSec=/a MaxRetentionSec=7day' /etc/systemd/journald.conf || \
        echo "MaxRetentionSec=7day" >> /etc/systemd/journald.conf
    fi
    
    systemctl restart systemd-journald 2>/dev/null || echo "⚠ Не удалось перезапустить journald"
    echo "✓ journald настроен (макс. 500MB, хранение 7 дней)"
else
    echo "⚠ journald не найден, пропускаем"
fi

# 8. Создание скрипта для ручной очистки
echo -e "\n8. Создание скрипта для ручной очистки..."
cat > /usr/local/bin/cleanup-disk.sh << 'EOF'
#!/bin/bash
# Ручная очистка диска

echo "=== ОЧИСТКА ДИСКА ==="

echo "1. Очистка старых логов (>7 дней)..."
find /var/log -type f -name "*.log.*" -mtime +7 -delete 2>/dev/null
find /var/log -type f -name "*.gz" -mtime +7 -delete 2>/dev/null
echo "✓ Логи очищены"

echo "2. Очистка временных файлов (>3 дня)..."
find /tmp -type f -mtime +3 -delete 2>/dev/null
find /var/tmp -type f -mtime +3 -delete 2>/dev/null
echo "✓ Временные файлы очищены"

if command -v docker &> /dev/null; then
    echo "3. Очистка Docker (только неиспользуемые ресурсы)..."
    echo "   Удаление dangling образов (неиспользуемые)..."
    docker image prune -f 2>/dev/null || true
    echo "   Удаление остановленных контейнеров (неиспользуемые)..."
    docker container prune -f 2>/dev/null || true
    echo "   Очистка build cache (неиспользуемый кэш)..."
    docker builder prune -af 2>/dev/null || true
    echo "   Полная очистка неиспользуемых ресурсов (работающие контейнеры НЕ удаляются)..."
    docker system prune -af 2>/dev/null || true
    echo "✓ Docker очищен"
fi

echo -e "\n=== ТЕКУЩЕЕ ИСПОЛЬЗОВАНИЕ ДИСКА ==="
df -h /

echo -e "\n=== ТОП-10 ПАПОК ПО РАЗМЕРУ ==="
du -sh /* 2>/dev/null | sort -hr | head -10
EOF
chmod +x /usr/local/bin/cleanup-disk.sh
echo "✓ Скрипт ручной очистки создан: /usr/local/bin/cleanup-disk.sh"

echo -e "\n=== НАСТРОЙКА ЗАВЕРШЕНА ==="
echo -e "\nСозданные скрипты:"
echo "  - /usr/local/bin/docker-cleanup.sh (еженедельная очистка Docker)"
echo "  - /usr/local/bin/tmp-cleanup.sh (ежедневная очистка временных файлов)"
echo "  - /usr/local/bin/disk-monitor.sh (мониторинг каждые 30 минут)"
echo "  - /usr/local/bin/cleanup-disk.sh (ручная очистка)"
echo -e "\nДля ручной очистки выполните: /usr/local/bin/cleanup-disk.sh"
echo -e "\nТекущее использование диска:"
df -h /

