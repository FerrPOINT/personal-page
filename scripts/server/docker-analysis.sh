#!/bin/bash
# Детальный анализ использования Docker и поиск лишних ресурсов

set +e

echo "=== АНАЛИЗ ИСПОЛЬЗОВАНИЯ DOCKER ==="
echo ""

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker не установлен, пропускаем анализ"
    exit 0
fi

# Проверка прав
if ! docker ps &> /dev/null; then
    echo "⚠️  Нет прав для выполнения Docker команд"
    echo "   Запустите с sudo: sudo $0"
    exit 1
fi

echo "1. ОБЩЕЕ ИСПОЛЬЗОВАНИЕ DOCKER:"
echo "---"
docker system df
echo ""

echo "2. ВСЕ ОБРАЗЫ (сортировка по размеру):"
echo "---"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}" | head -1
docker images --format "{{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}" | sort -k5 -hr | head -20
echo ""

echo "3. НЕИСПОЛЬЗУЕМЫЕ ОБРАЗЫ (dangling):"
echo "---"
DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
if [ -n "$DANGLING_IMAGES" ]; then
    echo "Найдено dangling образов: $(echo "$DANGLING_IMAGES" | wc -l)"
    docker images -f "dangling=true" --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}"
    echo ""
    echo "Размер dangling образов:"
    docker images -f "dangling=true" --format "{{.Size}}" | while read size; do
        echo "  - $size"
    done
else
    echo "✓ Dangling образов не найдено"
fi
echo ""

echo "4. ОБРАЗЫ БЕЗ ТЕГОВ (untagged):"
echo "---"
UNTAGGED=$(docker images --filter "dangling=true" --format "{{.ID}}")
if [ -n "$UNTAGGED" ]; then
    echo "Найдено untagged образов: $(echo "$UNTAGGED" | wc -l)"
    docker images --filter "dangling=true" --format "table {{.ID}}\t{{.Size}}\t{{.CreatedAt}}"
else
    echo "✓ Untagged образов не найдено"
fi
echo ""

echo "5. СТАРЫЕ ОБРАЗЫ (не использовались >30 дней):"
echo "---"
OLD_IMAGES=$(docker images --format "{{.ID}} {{.CreatedAt}}" | awk -v cutoff=$(date -d '30 days ago' +%s 2>/dev/null || date -v-30d +%s 2>/dev/null || echo "0") '{if ($2 < cutoff) print $1}')
if [ -n "$OLD_IMAGES" ]; then
    echo "Найдено старых образов: $(echo "$OLD_IMAGES" | wc -l)"
    for img in $OLD_IMAGES; do
        docker images --format "{{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep "$img" || docker images --format "{{.ID}}\t{{.Size}}\t{{.CreatedAt}}" | grep "$img"
    done
else
    echo "✓ Старых образов не найдено"
fi
echo ""

echo "6. ВСЕ КОНТЕЙНЕРЫ:"
echo "---"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Size}}"
echo ""

echo "7. ОСТАНОВЛЕННЫЕ КОНТЕЙНЕРЫ:"
echo "---"
STOPPED=$(docker ps -a --filter "status=exited" -q)
if [ -n "$STOPPED" ]; then
    echo "Найдено остановленных контейнеров: $(echo "$STOPPED" | wc -l)"
    docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Size}}"
    echo ""
    echo "Размер остановленных контейнеров:"
    docker ps -a --filter "status=exited" --format "{{.Size}}" | sort -u
else
    echo "✓ Остановленных контейнеров не найдено"
fi
echo ""

echo "8. VOLUMES (тома):"
echo "---"
docker volume ls
echo ""
echo "Неиспользуемые volumes:"
UNUSED_VOLUMES=$(docker volume ls -q -f dangling=true)
if [ -n "$UNUSED_VOLUMES" ]; then
    echo "Найдено неиспользуемых volumes: $(echo "$UNUSED_VOLUMES" | wc -l)"
    echo "$UNUSED_VOLUMES"
else
    echo "✓ Неиспользуемых volumes не найдено"
fi
echo ""

echo "9. NETWORKS (сети):"
echo "---"
docker network ls
echo ""
echo "Неиспользуемые сети:"
UNUSED_NETWORKS=$(docker network ls -q -f dangling=true)
if [ -n "$UNUSED_NETWORKS" ]; then
    echo "Найдено неиспользуемых сетей: $(echo "$UNUSED_NETWORKS" | wc -l)"
    echo "$UNUSED_NETWORKS"
else
    echo "✓ Неиспользуемых сетей не найдено"
fi
echo ""

echo "10. BUILD CACHE:"
echo "---"
BUILD_CACHE=$(docker system df | grep "Build Cache" | awk '{print $4}')
if [ -n "$BUILD_CACHE" ] && [ "$BUILD_CACHE" != "0B" ]; then
    echo "Размер build cache: $BUILD_CACHE"
    echo "  (можно очистить: docker builder prune -af)"
else
    echo "✓ Build cache пуст или отсутствует"
fi
echo ""

echo "11. РЕКОМЕНДАЦИИ ПО ОЧИСТКЕ:"
echo "---"
RECOMMENDATIONS=()

# Проверка dangling образов
if [ -n "$DANGLING_IMAGES" ]; then
    DANGLING_SIZE=$(docker images -f "dangling=true" --format "{{.Size}}" | head -1)
    RECOMMENDATIONS+=("Удалить dangling образы: docker image prune -af (освободит ~$DANGLING_SIZE)")
fi

# Проверка остановленных контейнеров
if [ -n "$STOPPED" ]; then
    RECOMMENDATIONS+=("Удалить остановленные контейнеры: docker container prune -f")
fi

# Проверка неиспользуемых volumes
if [ -n "$UNUSED_VOLUMES" ]; then
    RECOMMENDATIONS+=("Удалить неиспользуемые volumes: docker volume prune -f")
fi

# Проверка build cache
if [ -n "$BUILD_CACHE" ] && [ "$BUILD_CACHE" != "0B" ]; then
    RECOMMENDATIONS+=("Очистить build cache: docker builder prune -af")
fi

if [ ${#RECOMMENDATIONS[@]} -eq 0 ]; then
    echo "✓ Docker уже оптимизирован, лишних ресурсов не найдено"
else
    echo "Найдено возможностей для очистки:"
    for i in "${!RECOMMENDATIONS[@]}"; do
        echo "  $((i+1)). ${RECOMMENDATIONS[$i]}"
    done
    echo ""
    echo "Или очистить всё сразу:"
    echo "  docker system prune -af --volumes"
fi
echo ""

echo "12. РАЗМЕР DOCKER ДИРЕКТОРИИ:"
echo "---"
if [ -d "/var/lib/docker" ]; then
    echo "Размер /var/lib/docker:"
    du -sh /var/lib/docker 2>/dev/null || echo "  (не удалось определить)"
    echo ""
    echo "Топ поддиректорий:"
    du -sh /var/lib/docker/* 2>/dev/null | sort -hr | head -10
else
    echo "⚠️  /var/lib/docker не найден"
fi
echo ""

echo "=== АНАЛИЗ ЗАВЕРШЕН ==="

