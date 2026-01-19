# 🔍 Диагностика Telegram бота

## Шаг 1: Проверка статуса через API

После деплоя (через 2-3 минуты) откройте:

```
https://azhukov-dev.ru/api/telegram/status
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "telegram": {
    "tokenConfigured": true,
    "tokenLength": 46,
    "userIdConfigured": true,
    "userId": "754334329",
    "chatIdRegistered": true,
    "chatId": "754334329",
    "botConnected": true,
    "botUsername": "connected",
    "error": null
  }
}
```

## ❌ Возможные проблемы:

### 1. `tokenConfigured: false` или `tokenLength: 0`
**Проблема**: Токен не передается через Jenkins

**Решение**:
1. Откройте Jenkins: http://192.168.1.49:32768/
2. **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
3. Проверьте `telegram-bot-token`:
   - Если нет → создайте (ID: `telegram-bot-token`, Secret: `8243118630:AAF-_fBdgaHgclVab_7vS_X9k4oEZFpjkcM`)
   - Если есть → обновите Secret на новый токен
4. Запустите build: http://192.168.1.49:32768/job/personal-page-deploy/build

### 2. `botConnected: false` или есть `error`
**Проблема**: Токен неверный или заблокирован

**Решение**:
1. Проверьте токен в @BotFather
2. Если токен заблокирован → создайте новый
3. Обновите в Jenkins Credentials
4. Запустите новый build

### 3. `chatIdRegistered: false` или `chatId: null`
**Проблема**: Chat ID не зарегистрирован

**Решение**:
1. Откройте бота в Telegram
2. Отправьте **любое сообщение** боту (например: "test")
3. Бот должен ответить: `✅ Telegram Chat ID зарегистрирован: [ваш_chat_id]`
4. Проверьте статус снова: https://azhukov-dev.ru/api/telegram/status

### 4. `userIdConfigured: false`
**Проблема**: User ID не настроен в Jenkins

**Решение**:
1. Откройте Jenkins: http://192.168.1.49:32768/
2. **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
3. Проверьте `telegram-user-id`:
   - Если нет → создайте (ID: `telegram-user-id`, Secret: `754334329`)
   - Если есть → обновите если нужно
4. Запустите build

## Шаг 2: Проверка отправки сообщения

1. Откройте форму контактов: https://azhukov-dev.ru/#contact
2. Заполните и отправьте тестовое сообщение
3. Проверьте, пришло ли уведомление в Telegram

## Шаг 3: Проверка логов (если не работает)

Если сообщения не приходят, проверьте логи бэкенда:

```bash
# На сервере
docker logs personal-page-backend-1 --tail 100 | grep -i telegram
```

**Ожидаемые логи:**
```
✅ Telegram bot initialized. User ID: 754334329
✅ Telegram bot connected: @your_bot_username
✅ Saved chat ID for admin: 754334329
📨 Processing message 1 from test@example.com
✅ Message 1 sent successfully
```

**Проблемные логи:**
```
⚠️  TELEGRAM_BOT_TOKEN not set - Telegram service will not be available
❌ Telegram connection test failed: 401 Unauthorized
❌ Error sending message to Telegram: 400 Bad Request: chat not found
```

## 🔧 Быстрое исправление

Если ничего не работает, выполните:

1. **Проверьте Jenkins Credentials** (см. выше)
2. **Запустите build вручную**: http://192.168.1.49:32768/job/personal-page-deploy/build
3. **Отправьте сообщение боту** для регистрации chat_id
4. **Проверьте статус**: https://azhukov-dev.ru/api/telegram/status
5. **Отправьте тестовое сообщение** через форму контактов

## 📝 Текущая конфигурация

- **Токен**: `8243118630:AAF-_fBdgaHgclVab_7vS_X9k4oEZFpjkcM`
- **User ID**: `754334329`
- **Jenkins Credentials ID**: `telegram-bot-token` и `telegram-user-id`

