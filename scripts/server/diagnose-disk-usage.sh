#!/bin/bash
# Скрипт диагностики использования диска и поиска причин переполнения

set +e  # Не прерывать выполнение при ошибках

echo "=== ИСПОЛЬЗОВАНИЕ ДИСКА ==="
df -h

echo -e "\n=== ТОП-15 ПАПОК ПО РАЗМЕРУ ==="
du -sh /* 2>/dev/null | sort -hr | head -15

echo -e "\n=== ЛОГИ (размер) ==="
du -sh /var/log/* 2>/dev/null | sort -hr | head -10

echo -e "\n=== РАЗМЕР ЛОГОВ ПО ДАТАМ ==="
find /var/log -type f -name "*.log" -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -20

echo -e "\n=== СТАРЫЕ ЛОГИ (>30 дней) ==="
find /var/log -type f -name "*.log" -mtime +30 -exec ls -lh {} \; 2>/dev/null | wc -l
find /var/log -type f -name "*.log.*" -mtime +30 -exec ls -lh {} \; 2>/dev/null | wc -l

echo -e "\n=== DOCKER (если установлен) ==="
if command -v docker &> /dev/null; then
    echo "Docker images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null | head -10
    echo -e "\nDocker containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" 2>/dev/null
    echo -e "\nDocker volumes:"
    docker volume ls 2>/dev/null
    echo -e "\nDocker disk usage:"
    docker system df 2>/dev/null
fi

echo -e "\n=== КЭШИ ==="
if [ -d /tmp ] && [ "$(ls -A /tmp 2>/dev/null)" ]; then
    du -sh /tmp/* 2>/dev/null | sort -hr | head -10 || echo "  /tmp пуст или недоступен"
else
    echo "  /tmp пуст или недоступен"
fi
if [ -d /var/cache ] && [ "$(ls -A /var/cache 2>/dev/null)" ]; then
    du -sh /var/cache/* 2>/dev/null | sort -hr | head -10 || echo "  /var/cache пуст или недоступен"
else
    echo "  /var/cache пуст или недоступен"
fi

echo -e "\n=== БОЛЬШИЕ ФАЙЛЫ (>100MB) ==="
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | head -20

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

