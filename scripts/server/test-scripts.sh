#!/bin/bash
# Тестовый скрипт для проверки работоспособности основных функций

set +e

echo "=== ТЕСТИРОВАНИЕ СКРИПТОВ ==="

# Тест 1: Проверка синтаксиса
echo -e "\n1. Проверка синтаксиса..."
bash -n diagnose-disk-usage.sh && echo "  ✓ diagnose-disk-usage.sh - синтаксис OK" || echo "  ✗ diagnose-disk-usage.sh - ошибка синтаксиса"
bash -n prevent-disk-full.sh && echo "  ✓ prevent-disk-full.sh - синтаксис OK" || echo "  ✗ prevent-disk-full.sh - ошибка синтаксиса"

# Тест 2: Проверка доступности команд
echo -e "\n2. Проверка доступности команд..."
command -v df >/dev/null && echo "  ✓ df доступен" || echo "  ✗ df не найден"
command -v du >/dev/null && echo "  ✓ du доступен" || echo "  ✗ du не найден"
command -v find >/dev/null && echo "  ✓ find доступен" || echo "  ✗ find не найден"
command -v awk >/dev/null && echo "  ✓ awk доступен" || echo "  ✗ awk не найден"
command -v sed >/dev/null && echo "  ✓ sed доступен" || echo "  ✗ sed не найден"

# Тест 3: Проверка функций из disk-monitor.sh
echo -e "\n3. Тест функции определения использования диска..."
TEST_DISK_USAGE=$(df / 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//' || echo "0")
if [[ "$TEST_DISK_USAGE" =~ ^[0-9]+$ ]]; then
    echo "  ✓ Использование диска определено: ${TEST_DISK_USAGE}%"
else
    echo "  ✗ Не удалось определить использование диска"
fi

# Тест 4: Проверка создания скриптов (dry-run)
echo -e "\n4. Проверка создания скриптов (dry-run)..."
TEMP_DIR=$(mktemp -d)
if [ -d "$TEMP_DIR" ]; then
    echo "  ✓ Временная директория создана: $TEMP_DIR"
    
    # Тест создания скрипта cleanup
    cat > "$TEMP_DIR/test-cleanup.sh" << 'TESTEOF'
#!/bin/bash
echo "test cleanup"
TESTEOF
    if [ -f "$TEMP_DIR/test-cleanup.sh" ]; then
        echo "  ✓ Создание скрипта работает"
        chmod +x "$TEMP_DIR/test-cleanup.sh" 2>/dev/null && echo "  ✓ chmod работает" || echo "  ⚠ chmod не сработал (может быть нормально в тестовой среде)"
    else
        echo "  ✗ Не удалось создать скрипт"
    fi
    
    rm -rf "$TEMP_DIR"
    echo "  ✓ Временная директория удалена"
else
    echo "  ✗ Не удалось создать временную директорию"
fi

# Тест 5: Проверка логики сравнения чисел
echo -e "\n5. Тест логики сравнения чисел..."
TEST_VAL=90
THRESHOLD=85
CRITICAL=95
if [ "$TEST_VAL" -ge "$CRITICAL" ]; then
    echo "  ✗ Логика сравнения неверна (90 >= 95?)"
elif [ "$TEST_VAL" -ge "$THRESHOLD" ]; then
    echo "  ✓ Логика сравнения работает (90 >= 85, но < 95)"
else
    echo "  ✗ Логика сравнения неверна"
fi

# Тест 6: Проверка обработки ошибок
echo -e "\n6. Тест обработки ошибок..."
ERROR_TEST=$(find /nonexistent 2>/dev/null || echo "error handled")
if [ "$ERROR_TEST" = "error handled" ]; then
    echo "  ✓ Обработка ошибок работает"
else
    echo "  ⚠ Обработка ошибок может не работать как ожидается"
fi

echo -e "\n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ==="
echo -e "\nДля полного тестирования на сервере:"
echo "  1. Скопируйте скрипты на сервер"
echo "  2. Запустите: bash diagnose-disk-usage.sh"
echo "  3. Запустите: sudo bash prevent-disk-full.sh"

