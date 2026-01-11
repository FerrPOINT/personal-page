#!/bin/bash
# Скрипт для диагностики проблем на production сервере
# Выполнить на сервере: ssh root@azhukov-dev "bash -s" < check-server.sh

echo "=== Диагностика сервера ==="
echo ""

echo "1. Статус Docker контейнеров:"
cd /opt/personal-page 2>/dev/null || { echo "❌ Директория /opt/personal-page не найдена"; exit 1; }
docker compose ps

echo ""
echo "2. Проверка портов:"
netstat -tlnp | grep -E ":(8888|9000)" || ss -tlnp | grep -E ":(8888|9000)"

echo ""
echo "3. Логи backend (последние 20 строк):"
docker compose logs --tail=20 backend

echo ""
echo "4. Логи frontend (последние 20 строк):"
docker compose logs --tail=20 frontend

echo ""
echo "5. Проверка доступности контейнеров:"
curl -s http://localhost:8888 | head -5 || echo "❌ Frontend недоступен на localhost:8888"
curl -s http://localhost:9000/health | head -5 || echo "❌ Backend недоступен на localhost:9000"

echo ""
echo "6. Статус внешнего nginx:"
systemctl status nginx --no-pager | head -10

echo ""
echo "7. Конфигурация nginx:"
if [ -f /etc/nginx/sites-enabled/personal-page ]; then
    echo "✅ Конфиг найден:"
    cat /etc/nginx/sites-enabled/personal-page
elif [ -f /etc/nginx/sites-available/personal-page ]; then
    echo "⚠️  Конфиг есть, но не активирован"
    cat /etc/nginx/sites-available/personal-page
else
    echo "❌ Конфиг nginx не найден"
fi

echo ""
echo "8. Проверка синтаксиса nginx:"
nginx -t 2>&1

echo ""
echo "=== Рекомендации ==="
echo "Если контейнеры не запущены:"
echo "  cd /opt/personal-page && docker compose up -d --build"
echo ""
echo "Если nginx не настроен:"
echo "  См. инструкцию в info/deployment-guide.qmd раздел 'Настройка Nginx'"

