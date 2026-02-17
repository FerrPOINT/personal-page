#!/bin/bash
# Безопасная проверка того, что БУДЕТ удалено (dry-run)
# НЕ удаляет ничего, только показывает

set +e

echo "=== БЕЗОПАСНАЯ ПРОВЕРКА (DRY-RUN) ==="
echo "Этот скрипт НЕ удаляет ничего, только показывает что БУДЕТ удалено"
echo ""

# 1. Логи, которые будут удалены при setup (>30 дней)
echo "1. Логи старше 30 дней (будут удалены при setup):"
echo "   Количество файлов:"
find /var/log -type f -name "*.log.*" -mtime +30 2>/dev/null | wc -l
find /var/log -type f -name "*.gz" -mtime +30 2>/dev/null | wc -l
echo ""
echo "   Размер (первые 20 файлов):"
find /var/log -type f -name "*.log.*" -mtime +30 -exec ls -lh {} \; 2>/dev/null | head -20
find /var/log -type f -name "*.gz" -mtime +30 -exec ls -lh {} \; 2>/dev/null | head -20
echo ""
echo "   Общий размер:"
du -sh $(find /var/log -type f \( -name "*.log.*" -o -name "*.gz" \) -mtime +30 2>/dev/null) 2>/dev/null | tail -1 || echo "   (не удалось подсчитать)"
echo ""

# 2. Логи, которые будут удалены при cleanup (>7 дней)
echo "2. Логи старше 7 дней (будут удалены при cleanup):"
echo "   Количество файлов:"
find /var/log -type f -name "*.log.*" -mtime +7 2>/dev/null | wc -l
find /var/log -type f -name "*.gz" -mtime +7 2>/dev/null | wc -l
echo ""

# 3. Временные файлы, которые будут удалены (>7 дней)
echo "3. Временные файлы старше 7 дней (будут удалены при cleanup):"
echo "   Количество файлов в /tmp:"
find /tmp -type f -mtime +7 2>/dev/null | wc -l
echo "   Количество файлов в /var/tmp:"
find /var/tmp -type f -mtime +7 2>/dev/null | wc -l
echo ""
echo "   Размер (первые 20 файлов из /tmp):"
find /tmp -type f -mtime +7 -exec ls -lh {} \; 2>/dev/null | head -20
echo ""

# 4. Docker (если установлен)
if command -v docker &> /dev/null; then
    echo "4. Docker ресурсы (будут удалены при cleanup, если старше 72 часов):"
    echo "   Неиспользуемые образы:"
    docker images --filter "dangling=true" --format "{{.Repository}}:{{.Tag}} ({{.Size}})" 2>/dev/null | head -10
    echo ""
    echo "   Остановленные контейнеры:"
    docker ps -a --filter "status=exited" --format "{{.Names}} ({{.Status}})" 2>/dev/null | head -10
    echo ""
    echo "   Использование Docker:"
    docker system df 2>/dev/null || echo "   (не удалось получить информацию)"
else
    echo "4. Docker не установлен, пропускаем"
fi
echo ""

# 5. Текущее использование диска
echo "5. Текущее использование диска:"
df -h / | tail -1
echo ""

# 6. Важные директории (НЕ будут удалены)
echo "6. Важные директории (НЕ будут удалены):"
echo "   ✓ /opt/personal-page/ - код проекта"
echo "   ✓ /var/lib/docker/volumes/ - Docker volumes с данными"
echo "   ✓ /home/ - домашние директории"
echo "   ✓ /etc/ - конфигурационные файлы"
echo "   ✓ Активные логи (только архивы старше срока)"
echo "   ✓ Базы данных"
echo ""

echo "=== ПРОВЕРКА ЗАВЕРШЕНА ==="
echo ""
echo "⚠️  ВАЖНО: Этот скрипт НЕ удаляет ничего!"
echo "   Для реального удаления используйте:"
echo "   - sudo ./scripts/server/disk-manager.sh setup (удаляет логи >30 дней)"
echo "   - sudo ./scripts/server/disk-manager.sh cleanup (удаляет логи >7 дней, временные >3 дня)"

