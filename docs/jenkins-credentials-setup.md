# Настройка Jenkins Credentials для Telegram Bot

## Требуемые Credentials

В Jenkins должны быть настроены следующие credentials:

1. **`telegram-bot-token`** (тип: Secret text)
   - Значение: `7814170579:AAGlep9wSPx9gRlA0uKcVCC3J9PmPpV7JUM`
   - Используется для production бота

2. **`telegram-user-id`** (тип: Secret text)
   - Значение: `754334329`
   - User ID администратора

## Инструкция по настройке

### Через Jenkins UI:

1. Откройте Jenkins: `http://192.168.1.49:32768/`
2. Войдите с учетными данными `ferrpoint`
3. Перейдите: **Manage Jenkins** → **Credentials** → **System** → **Global credentials (unrestricted)**
4. Нажмите **Add Credentials**

#### Для `telegram-bot-token`:
- **Kind**: Secret text
- **Secret**: `7814170579:AAGlep9wSPx9gRlA0uKcVCC3J9PmPpV7JUM`
- **ID**: `telegram-bot-token` (обязательно!)
- **Description**: `Production Telegram Bot Token`
- Нажмите **OK**

#### Для `telegram-user-id`:
- **Kind**: Secret text
- **Secret**: `754334329`
- **ID**: `telegram-user-id` (обязательно!)
- **Description**: `Telegram User ID (Admin)`
- Нажмите **OK**

### Проверка через API:

```bash
# Проверка существования credentials (без значений)
curl -s -u ferrpoint:YOUR_API_TOKEN \
  "http://192.168.1.49:32768/scriptText" \
  -d "script=import jenkins.model.Jenkins; def store = Jenkins.instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore(); def domain = store.getDomains()[0]; def creds = domain.getCredentials(); creds.each { println it.id }"
```

Должны быть видны: `telegram-bot-token` и `telegram-user-id`

## Важно

- **ID credentials должны точно совпадать** с указанными в `Jenkinsfile`:
  - `telegram-bot-token`
  - `telegram-user-id`
- Если credentials не найдены, Jenkins будет использовать значения из `.env` на сервере
- Production токен: `7814170579:AAGlep9wSPx9gRlA0uKcVCC3J9PmPpV7JUM`
- Локальный токен (для разработки): `8442009009:AAFZlXWyWorao-qVt_9Eq6Tm2HSCSMJO_7g`

