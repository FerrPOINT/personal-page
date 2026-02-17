# ⚡ Быстрая справка - Управление диском на сервере

## 🚀 Быстрый старт

```bash
cd /opt/personal-page
git pull
sudo ./scripts/server/disk-manager.sh setup
./scripts/server/verify-setup.sh
```

## 📋 Основные команды

| Команда | Описание | Root |
|---------|----------|------|
| `./scripts/server/disk-manager.sh diagnose` | Диагностика | ❌ |
| `sudo ./scripts/server/disk-manager.sh setup` | Настройка | ✅ |
| `sudo ./scripts/server/disk-manager.sh cleanup` | Очистка | ✅ |
| `./scripts/server/disk-manager.sh status` | Статус | ❌ |
| `./scripts/server/verify-setup.sh` | Проверка | ❌ |

## ✅ Проверка работы

```bash
# 1. Проверка cron
crontab -l | grep -E "disk-monitor|docker-cleanup|tmp-cleanup"

# 2. Проверка скриптов
ls -la /usr/local/bin/*cleanup*.sh /usr/local/bin/disk-monitor.sh

# 3. Тест мониторинга
sudo /usr/local/bin/disk-monitor.sh
cat /var/log/disk-monitor.log

# 4. Автоматическая проверка
./scripts/server/verify-setup.sh
```

## 📊 Мониторинг

```bash
# Логи
tail -f /var/log/disk-monitor.log
tail -f /var/log/*-cleanup.log

# Использование диска
df -h /
```

## 🔧 Что настраивается

- ✅ Ротация логов (7 дней)
- ✅ Очистка Docker (еженедельно)
- ✅ Очистка временных файлов (ежедневно)
- ✅ Мониторинг диска (каждые 30 минут)
- ✅ Автоочистка при >95%

## 📚 Документация

- `ON-SERVER.md` - Инструкция для сервера
- `README.md` - Подробная документация
- `VERIFICATION.md` - План проверки

