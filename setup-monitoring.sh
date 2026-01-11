#!/bin/bash
# Скрипт установки мониторинга и автозапуска
# Выполнить на production сервере: bash setup-monitoring.sh

set -e

DEPLOY_PATH="/opt/personal-page"

echo "🔧 Настройка мониторинга и автозапуска..."

# 1. Копируем systemd сервисы
echo "📋 Установка systemd сервисов..."
cp "$DEPLOY_PATH/systemd/personal-page.service" /etc/systemd/system/
cp "$DEPLOY_PATH/systemd/personal-page-monitor.service" /etc/systemd/system/
cp "$DEPLOY_PATH/systemd/personal-page-monitor.timer" /etc/systemd/system/

# 2. Делаем скрипт мониторинга исполняемым
chmod +x "$DEPLOY_PATH/monitor.sh"

# 3. Создаем директорию для логов
mkdir -p /var/log
touch /var/log/personal-page-monitor.log
chmod 644 /var/log/personal-page-monitor.log

# 4. Перезагружаем systemd
systemctl daemon-reload

# 5. Включаем автозапуск приложения
echo "🚀 Включение автозапуска приложения..."
systemctl enable personal-page.service
systemctl start personal-page.service

# 6. Включаем мониторинг
echo "👁️  Включение мониторинга..."
systemctl enable personal-page-monitor.timer
systemctl start personal-page-monitor.timer

# 7. Проверяем статус
echo ""
echo "📊 Статус сервисов:"
systemctl status personal-page.service --no-pager | head -10
echo ""
systemctl status personal-page-monitor.timer --no-pager | head -10

echo ""
echo "✅ Мониторинг настроен!"
echo ""
echo "Полезные команды:"
echo "  systemctl status personal-page.service    - статус приложения"
echo "  systemctl status personal-page-monitor.timer - статус мониторинга"
echo "  journalctl -u personal-page.service -f   - логи приложения"
echo "  journalctl -u personal-page-monitor.service -f - логи мониторинга"
echo "  tail -f /var/log/personal-page-monitor.log - логи мониторинга"

