# 🔐 Создание Jenkins Credentials для нового Telegram токена

## Настройка токена
**TELEGRAM_BOT_TOKEN**: Получите токен в @BotFather в Telegram

## Шаг 1: Открыть Jenkins
1. Откройте: http://192.168.1.49:32768/
2. Войдите: `ferrpoint` / токен

## Шаг 2: Создать Credential для Bot Token
1. **Manage Jenkins** → **Credentials** → **System** → **Global credentials (unrestricted)**
2. Нажмите **Add Credentials**
3. Заполните:
   - **Kind**: `Secret text`
   - **Secret**: `<ваш_токен_из_BotFather>`
   - **ID**: `telegram-bot-token` (ВАЖНО: именно такой ID!)
   - **Description**: `Telegram Bot Token for personal-page notifications`
4. Нажмите **OK**

## Шаг 3: Создать Credential для User ID
1. Нажмите **Add Credentials** еще раз
2. Заполните:
   - **Kind**: `Secret text`
   - **Secret**: `754334329`
   - **ID**: `telegram-user-id` (ВАЖНО: именно такой ID!)
   - **Description**: `Telegram User ID for personal-page notifications`
3. Нажмите **OK**

## Шаг 4: Проверить работу
1. Запустите build в Jenkins
2. В логах должно быть:
   ```
   🔐 TELEGRAM_BOT_TOKEN обновлен из Jenkins Credentials
   🔐 TELEGRAM_USER_ID обновлен из Jenkins Credentials
   ```

## Важно!
- Токен НЕ должен быть в Git (env.prod и env.local содержат placeholder)
- Токен передается через переменные окружения при деплое
- Если credentials уже существуют - обновите их (Edit → измените Secret)
