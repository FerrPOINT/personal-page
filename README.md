# Personal Portfolio - Aleksandr Zhukov

Senior Software Architect portfolio website built with React, TypeScript, Vite, and Three.js.

## 🏗️ Project Structure

```
personal-page/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── constants/    # Application constants
│   │   ├── types/        # TypeScript type definitions
│   │   ├── App.tsx       # Main application component
│   │   └── main.tsx      # Application entry point
│   ├── public/           # Static assets
│   ├── Dockerfile        # Frontend Docker image
│   ├── nginx.conf        # Nginx configuration
│   └── package.json
│
├── backend/              # Backend API + Worker
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── models/       # Data models
│   │   ├── workers/      # Background workers
│   │   └── index.ts      # Server entry point
│   ├── db/
│   │   └── migrations/   # Database migrations
│   ├── Dockerfile        # Backend Docker image
│   └── package.json
│
├── docker-compose.yml    # Docker Compose configuration
└── README.md

```

## 🚀 Quick Start

### Development

#### 1. Настройка переменных окружения
```bash
# Скопируйте env.example.txt в .env
cp env.example.txt .env

# Или используйте Makefile
make local

# Заполните значения в .env файле (особенно TELEGRAM_BOT_TOKEN, DATABASE_PATH опционален)
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:8888`

#### 3. Backend
```bash
cd backend
npm install
npm run dev
```
Backend API will be available at `http://localhost:9000`

### Production Build

#### Using Docker Compose (Recommended)

```bash
# Настройка окружения (копирует env.local в .env)
make local

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

Services:
- **Frontend**: `http://localhost:8888`
- **Backend API**: `http://localhost:9000`
- **SQLite Database**: Stored in `./data/database.db` (created automatically)

## 📦 Technologies

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Three.js** - 3D graphics
- **Framer Motion** - Animations
- **Nginx** - Production web server

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **SQLite** - Database (via better-sqlite3)
- **Telegram Bot API** - Notifications
- **Helmet.js** - Security headers
- **express-rate-limit** - Rate limiting protection

## 🔧 Configuration

### Environment Variables

**Важно**: Используйте единый `.env` файл в корне проекта. Не создавайте `.env` файлы в `backend/` или `frontend/`.

Создайте файл `.env` в корне проекта со следующим содержимым:
```env
# Database (SQLite)
# Path to SQLite database file (default: ./data/database.db, created automatically)
DATABASE_PATH=./data/database.db

# Telegram Bot (optional - worker will not start without token)
# 
# 1. Get TELEGRAM_BOT_TOKEN:
#    - Open Telegram and search for @BotFather
#    - Send /newbot command
#    - Follow instructions to create a bot
#    - Copy the token you receive
#
# 2. Register your user ID (automatic):
#    - After starting the backend, send ANY message to your bot
#    - The bot will automatically save your user ID (from the message)
#    - You will receive a confirmation message
#    - The bot will use YOUR user ID to send notifications to you
#
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Backend API Configuration
API_PORT=9000
NODE_ENV=development

# Frontend API Configuration
# VITE_API_URL не нужен для продакшн - используется относительный путь /api
# Для локальной разработки можно указать: VITE_API_URL=http://localhost:9000/api
# VITE_API_URL=http://localhost:9000/api

# Gemini API (if needed)
GEMINI_API_KEY=your_gemini_api_key_here
```

**Примечание**: 
- Файл `.env` находится в `.gitignore` и не попадает в репозиторий
- **Скопируйте `env.example.txt` в `.env`** (или используйте `make local`) и заполните значения
- Docker Compose автоматически подхватывает переменные из `.env` файла в корне проекта
- Для локальной разработки переменные загружаются через `dotenv` в backend и `vite.config.ts` в frontend
- В Docker переменные прокидываются через секцию `environment` в `docker-compose.yml`
- **Для продакшн**: `VITE_API_URL` не нужен - приложение использует относительный путь `/api`
- **Не создавайте** `.env` файлы в `backend/` или `frontend/` - используйте единый `.env` в корне проекта

### Как зарегистрировать ваш User ID (автоматически)

**Автоматический способ:**
1. Запустите backend сервер
2. Откройте Telegram и найдите вашего бота
3. Отправьте боту ЛЮБОЕ сообщение (например, "Привет")
4. Бот автоматически сохранит ваш User ID из сообщения и отправит подтверждение
5. Готово! Теперь бот будет отправлять уведомления на ваш User ID

**Важно**: Бот использует ID пользователя, который написал ему первым. Это ваш личный User ID, который Telegram присваивает каждому пользователю.
4. Бот покажет ваш Chat ID

**Способ 2 (через API вашего бота):**
1. Отправьте любое сообщение вашему боту
2. Откройте в браузере: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. В ответе найдите `"chat":{"id":123456789}`
4. Это число и есть ваш Chat ID

**Способ 3 (через @RawDataBot):**
1. Откройте Telegram
2. Найдите бота `@RawDataBot`
3. Начните с ним чат
4. Бот покажет ваш Chat ID

## 📝 Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations

## 🏭 Production Deployment

The Docker setup uses multi-stage builds:
1. **Frontend**: Builds React app and serves with Nginx (port 8888)
2. **Backend**: Builds TypeScript and runs Node.js server with SQLite database (port 9000)

All services are orchestrated via Docker Compose.

### Production Setup

**Важно для продакшн:**
- Приложение использует **относительный путь `/api`** для API запросов
- `VITE_API_URL` **НЕ НУЖЕН** в `.env` для продакшн - приложение автоматически использует тот же протокол и домен
- Для работы необходимо настроить **Nginx** как reverse proxy:
  - `/` → frontend (localhost:8888)
  - `/api` → backend (localhost:9000)

Подробная инструкция по развертыванию: см. `info/deployment-guide.qmd`

## 🛠️ Development Guide

### Prerequisites

- **Node.js**: v18+ (рекомендуется v20+)
- **npm**: v9+ или **yarn** v1.22+
- **Docker**: v20+ и **Docker Compose** v2+ (для production)
- **Git**: для работы с репозиторием

### Makefile Commands

Проект использует кроссплатформенный Makefile для упрощения работы:

```bash
# Настройка окружения
make local              # Копирует env.local в .env и настраивает локальную разработку
make prod               # Копирует env.prod в .env для продакшн окружения

# Docker команды
make docker-up          # Запускает Docker контейнеры
make docker-down        # Останавливает Docker контейнеры
make docker-build       # Пересобирает и запускает контейнеры
make docker-logs        # Показывает логи всех контейнеров
make docker-logs-backend   # Логи только backend
make docker-logs-frontend # Логи только frontend
make docker-clean       # Останавливает и удаляет контейнеры с volumes

# Локальная разработка
make dev-backend        # Запускает backend в режиме разработки
make dev-frontend       # Запускает frontend в режиме разработки
make build-backend      # Собирает backend
make build-frontend    # Собирает frontend

# Утилиты
make install            # Устанавливает зависимости для backend и frontend
make migrate            # Запускает миграции БД
make clean              # Полная очистка (контейнеры, volumes, образы, .env)
make help               # Показывает справку по командам
```

### Architecture Overview

Приложение состоит из двух основных компонентов:

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │
│   (React + Vite)│────────▶│  (Express API)  │
│   Port: 8888    │  /api   │   Port: 9000    │
└─────────────────┘         └────────┬────────┘
                                      │
                              ┌───────▼────────┐
                              │   SQLite DB    │
                              │  (./data/*.db) │
                              └────────┬───────┘
                                       │
                              ┌────────▼────────┐
                              │ Telegram Worker │
                              │  (Background)   │
                              └─────────────────┘
```

**Компоненты:**
- **Frontend**: React SPA, собирается в статические файлы, обслуживается через Nginx
- **Backend**: Express API сервер с REST endpoints
- **Database**: SQLite (файловая БД, создается автоматически)
- **Worker**: Фоновый процесс для отправки уведомлений в Telegram

### API Documentation

#### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "personal-page-backend",
  "database": "connected",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### Contact Form

```http
POST /api/contact
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'm interested in your work!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message saved successfully",
  "data": {
    "id": "uuid-here",
    "status": "pending"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Email is required",
    "Message must be at least 10 characters"
  ]
}
```

**Rate Limiting:**
- 5 запросов на IP за 15 минут
- При превышении: HTTP 429 с сообщением об ошибке

### Database Schema

База данных SQLite с автоматическими миграциями:

**Messages Table:**
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  error_message TEXT
);
```

**BotSettings Table:**
```sql
CREATE TABLE bot_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_user_id TEXT,
  telegram_chat_id TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Миграции:**
- Миграции находятся в `backend/db/migrations/`
- Запуск: `npm run migrate` (в backend директории) или `make migrate`
- Миграции выполняются автоматически при первом запуске

### Development Workflow

#### 1. Первый запуск

```bash
# Клонирование репозитория
git clone <repository-url>
cd personal-page

# Настройка окружения
make local

# Установка зависимостей
make install

# Запуск миграций
make migrate

# Запуск через Docker (рекомендуется)
make docker-build

# Или локальная разработка
make dev-backend    # В отдельном терминале
make dev-frontend   # В другом терминале
```

#### 2. Локальная разработка

**Backend:**
```bash
cd backend
npm run dev  # Запускает с hot reload (tsx watch)
```

**Frontend:**
```bash
cd frontend
npm run dev  # Запускает Vite dev server на http://localhost:5173
```

**Важно для локальной разработки:**
- Backend должен быть доступен на `http://localhost:9000`
- Frontend должен быть настроен с `VITE_API_URL=http://localhost:9000/api` в `.env`
- CORS настроен для `http://localhost:8888` и `http://localhost:5173`

#### 3. Тестирование изменений

```bash
# Проверка линтера (если настроен)
npm run lint

# Запуск тестов (если есть)
npm test

# Проверка типов TypeScript
npm run type-check  # или tsc --noEmit
```

### Troubleshooting

#### Проблема: Backend не запускается

**Проверьте:**
1. Порт 9000 не занят: `netstat -an | grep 9000` (Linux/Mac) или `netstat -an | findstr 9000` (Windows)
2. Переменные окружения в `.env` корректны
3. База данных создана: проверьте `./data/database.db`
4. Зависимости установлены: `cd backend && npm install`

**Решение:**
```bash
# Очистка и переустановка
cd backend
rm -rf node_modules package-lock.json
npm install
npm run migrate
npm run dev
```

#### Проблема: Frontend не подключается к Backend

**Проверьте:**
1. Backend запущен и доступен на `http://localhost:9000`
2. `VITE_API_URL` в `.env` установлен: `VITE_API_URL=http://localhost:9000/api`
3. CORS настроен правильно (проверьте `FRONTEND_URL` в backend `.env`)
4. Нет ошибок в консоли браузера (F12)

**Решение:**
```bash
# Проверка backend
curl http://localhost:9000/health

# Проверка API
curl -X POST http://localhost:9000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Test message"}'
```

#### Проблема: Telegram бот не отправляет сообщения

**Проверьте:**
1. `TELEGRAM_BOT_TOKEN` установлен и валиден
2. Бот запущен и отвечает на команды
3. User ID зарегистрирован (отправьте сообщение боту)
4. Логи backend показывают успешное подключение к Telegram

**Решение:**
```bash
# Проверка токена через API
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"

# Проверка логов
make docker-logs-backend
# или
cd backend && npm run dev
```

#### Проблема: База данных не создается

**Решение:**
```bash
# Создание директории вручную
mkdir -p data
chmod 777 data  # Linux/Mac

# Запуск миграций вручную
cd backend
npm run migrate

# Проверка файла БД
ls -la data/database.db
```

#### Проблема: Docker контейнеры не запускаются

**Решение:**
```bash
# Проверка логов
make docker-logs

# Пересборка с нуля
make docker-clean
make docker-build

# Проверка портов
docker ps
netstat -an | grep 8888
netstat -an | grep 9000
```

### Code Structure

#### Backend Structure

```
backend/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── routes/
│   │   └── contact.ts        # Contact form API route
│   ├── services/
│   │   ├── database.ts       # SQLite connection and queries
│   │   ├── telegram.ts       # Telegram bot service
│   │   └── validation.ts     # Input validation and sanitization
│   ├── models/
│   │   ├── Message.ts        # Message data model
│   │   └── BotSettings.ts    # Bot settings model
│   ├── workers/
│   │   └── telegram-worker.ts # Background worker for notifications
│   └── types/
│       └── telegram-bot-api.d.ts # TypeScript definitions
├── db/
│   ├── migrate.ts            # Migration runner
│   └── migrations/
│       └── 001_create_messages_table.sql
└── package.json
```

**Ключевые файлы:**
- `src/index.ts`: Настройка Express, middleware, routes, graceful shutdown
- `src/routes/contact.ts`: POST `/api/contact` endpoint с rate limiting
- `src/services/database.ts`: SQLite операции (CRUD для messages)
- `src/services/telegram.ts`: Отправка сообщений в Telegram
- `src/workers/telegram-worker.ts`: Фоновый worker для обработки сообщений

#### Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx                # Main application component
│   ├── components/
│   │   ├── Contact.tsx        # Contact form component
│   │   ├── Hero.tsx           # Hero section
│   │   ├── Navbar.tsx         # Navigation
│   │   └── ...                # Other components
│   ├── constants/
│   │   └── index.ts           # App constants
│   └── types/
│       └── index.ts           # TypeScript types
├── public/
│   ├── index.html
│   └── metadata.json
├── Dockerfile                 # Production build
├── nginx.conf                 # Nginx configuration
└── vite.config.ts             # Vite configuration
```

### Security Considerations

- **Rate Limiting**: 5 запросов на IP за 15 минут для contact form
- **Input Sanitization**: Все пользовательские данные санитизируются
- **CORS**: Настроен только для разрешенных origins
- **Helmet**: Используется для базовой защиты Express
- **Environment Variables**: Секреты хранятся в `.env` (не в git)
- **SQL Injection**: Защита через параметризованные запросы (better-sqlite3)

### Contributing

1. Создайте feature branch: `git checkout -b feature/your-feature`
2. Внесите изменения и протестируйте
3. Убедитесь, что код проходит линтер и типы корректны
4. Создайте commit с понятным сообщением
5. Push и создайте Pull Request

**Стиль кода:**
- TypeScript строгий режим
- ESLint/Prettier (если настроены)
- Комментарии для сложной логики
- Именование: camelCase для переменных, PascalCase для компонентов/классов

### Additional Resources

- **Документация проекта**: `info/` директория
- **Деплой инструкции**: `info/deployment-guide.qmd`
- **Спринты и задачи**: `info/sprint1/`
- **API примеры**: см. `backend/src/routes/contact.ts`

## 📄 License

Private project - All rights reserved
