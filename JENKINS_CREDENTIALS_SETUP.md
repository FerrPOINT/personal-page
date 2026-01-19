# 🔐 Настройка Jenkins Credentials для Telegram токенов

## Проблема
В логах Jenkins видно: "telegram-bot-token credentials не найдены, используем .env на сервере"

Это означает, что токены не передаются через Jenkins Credentials, а берутся из .env на сервере.

## Решение: Создать Credentials в Jenkins

### Шаг 1: Открыть Jenkins UI
1. Откройте: http://192.168.1.49:32768/
2. Войдите с учетными данными

### Шаг 2: Создать Credential для Telegram Bot Token
1. Перейдите: **Manage Jenkins** → **Credentials** → **System** → **Global credentials (unrestricted)**
2. Нажмите **Add Credentials**
3. Заполните:
   - **Kind**: Secret text
   - **Secret**: `7814170579:AAGlep9wSPx9gRlA0uKcVCC3J9PmPpV7JUM` (НОВЫЙ токен после отзыва старого!)
   - **ID**: `telegram-bot-token` (ВАЖНО: именно такой ID!)
   - **Description**: `Telegram Bot Token for personal-page notifications`
4. Нажмите **OK**

### Шаг 3: Создать Credential для Telegram User ID
1. Нажмите **Add Credentials** еще раз
2. Заполните:
   - **Kind**: Secret text
   - **Secret**: `754334329` (ваш Telegram User ID)
   - **ID**: `telegram-user-id` (ВАЖНО: именно такой ID!)
   - **Description**: `Telegram User ID for personal-page notifications`
3. Нажмите **OK**

### Шаг 4: Проверить работу
1. Запустите build в Jenkins
2. В логах должно быть:
   ```
   🔐 TELEGRAM_BOT_TOKEN обновлен из Jenkins Credentials
   🔐 TELEGRAM_USER_ID обновлен из Jenkins Credentials
   ```
3. НЕ должно быть:
   ```
   ⚠️  telegram-bot-token credentials не найдены
   ```

## Важно!
- После отзыва старых токенов и создания новых - обновите credentials в Jenkins
- Токены НЕ должны храниться в Git (env.prod и env.local теперь содержат placeholder)
- Токены передаются через переменные окружения при деплое
