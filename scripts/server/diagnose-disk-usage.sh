#!/bin/bash
# Скрипт диагностики использования диска и поиска причин переполнения

set +e  # Не прерывать выполнение при ошибках

echo "=== ИСПОЛЬЗОВАНИЕ ДИСКА ==="
df -h

echo -e "\n=== ТОП-20 ПАПОК ПО РАЗМЕРУ (корневой уровень) ==="
du -sh /* 2>/dev/null | sort -hr | head -20

echo -e "\n=== ДЕТАЛЬНЫЙ РАЗМЕР ПАПОК В /var ==="
du -sh /var/* 2>/dev/null | sort -hr | head -15

echo -e "\n=== ДЕТАЛЬНЫЙ РАЗМЕР ПАПОК В /opt ==="
du -sh /opt/* 2>/dev/null | sort -hr | head -15

echo -e "\n=== ДЕТАЛЬНЫЙ РАЗМЕР ПАПОК В /usr ==="
du -sh /usr/* 2>/dev/null | sort -hr | head -15

echo -e "\n=== ЛОГИ (размер) ==="
du -sh /var/log/* 2>/dev/null | sort -hr | head -20

echo -e "\n=== САМЫЕ БОЛЬШИЕ ЛОГИ (>50MB) ==="
find /var/log -type f -size +50M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -20

echo -e "\n=== РАЗМЕР ЛОГОВ ПО ДАТАМ ==="
find /var/log -type f -name "*.log" -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -20

echo -e "\n=== СТАРЫЕ ЛОГИ (>30 дней) ==="
find /var/log -type f -name "*.log" -mtime +30 -exec ls -lh {} \; 2>/dev/null | wc -l
find /var/log -type f -name "*.log.*" -mtime +30 -exec ls -lh {} \; 2>/dev/null | wc -l

echo -e "\n=== DOCKER (если установлен) ==="
if command -v docker &> /dev/null; then
    echo "Docker disk usage:"
    docker system df 2>/dev/null || echo "  (не удалось получить информацию)"
    echo -e "\nDocker images (топ-10 по размеру):"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null | head -11
    echo -e "\nDangling images (неиспользуемые):"
    DANGLING=$(docker images -f "dangling=true" -q 2>/dev/null)
    if [ -n "$DANGLING" ]; then
        echo "  Найдено: $(echo "$DANGLING" | wc -l) образов"
        docker images -f "dangling=true" --format "  {{.ID}} ({{.Size}})" 2>/dev/null | head -5
    else
        echo "  ✓ Dangling образов не найдено"
    fi
    echo -e "\nDocker containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" 2>/dev/null | head -11
    STOPPED=$(docker ps -a --filter "status=exited" -q 2>/dev/null)
    if [ -n "$STOPPED" ]; then
        echo "  Остановленных контейнеров: $(echo "$STOPPED" | wc -l)"
    fi
    echo -e "\nDocker volumes:"
    docker volume ls 2>/dev/null | head -10
    UNUSED_VOLUMES=$(docker volume ls -q -f dangling=true 2>/dev/null)
    if [ -n "$UNUSED_VOLUMES" ]; then
        echo "  Неиспользуемых volumes: $(echo "$UNUSED_VOLUMES" | wc -l)"
    fi
    echo -e "\nДля детального анализа Docker запустите:"
    echo "  ./scripts/server/docker-analysis.sh"
fi

echo -e "\n=== КЭШИ ==="
if [ -d /tmp ] && [ "$(ls -A /tmp 2>/dev/null)" ]; then
    echo "Размер /tmp:"
    du -sh /tmp 2>/dev/null
    du -sh /tmp/* 2>/dev/null | sort -hr | head -10 || echo "  /tmp пуст или недоступен"
else
    echo "  /tmp пуст или недоступен"
fi
if [ -d /var/cache ] && [ "$(ls -A /var/cache 2>/dev/null)" ]; then
    echo "Размер /var/cache:"
    du -sh /var/cache 2>/dev/null
    du -sh /var/cache/* 2>/dev/null | sort -hr | head -15 || echo "  /var/cache пуст или недоступен"
else
    echo "  /var/cache пуст или недоступен"
fi

echo -e "\n=== РАЗМЕР DOCKER ДИРЕКТОРИИ ==="
if [ -d /var/lib/docker ]; then
    echo "Общий размер /var/lib/docker:"
    du -sh /var/lib/docker 2>/dev/null
    echo "Детальный размер поддиректорий:"
    du -sh /var/lib/docker/* 2>/dev/null | sort -hr | head -10
else
    echo "  /var/lib/docker не найден"
fi

echo -e "\n=== БОЛЬШИЕ ФАЙЛЫ (>100MB) ==="
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -30

echo -e "\n=== БОЛЬШИЕ ФАЙЛЫ (>500MB) ==="
find / -type f -size +500M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -20

echo -e "\n=== БОЛЬШИЕ ФАЙЛЫ (>1GB) ==="
find / -type f -size +1G -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr

echo -e "\n=== INODE USAGE ==="
df -i

echo -e "\n=== ПРОЦЕССЫ С ВЫСОКИМ I/O ==="
iotop -b -n 1 -o 2>/dev/null | head -20 || echo "iotop not installed"

echo -e "\n=== СИСТЕМНЫЕ ЛОГИ (последние ошибки) ==="
journalctl -p err -n 50 --no-pager 2>/dev/null | grep -i "disk\|space\|full\|no space" | tail -20 || echo "journalctl not available"

echo -e "\n=== КРОН ЗАДАЧИ (могут создавать логи) ==="
crontab -l 2>/dev/null || echo "No crontab for root"
ls -la /etc/cron.* 2>/dev/null | head -20

echo -e "\n=== SWAP USAGE ==="
free -h
swapon --show 2>/dev/null || echo "No swap configured"

echo -e "\n=== ПАМЯТЬ ==="
free -h
echo -e "\nTop memory consumers:"
ps aux --sort=-%mem | head -10

