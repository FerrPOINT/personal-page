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
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
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
VITE_API_URL=http://localhost:9000/api

# Gemini API (if needed)
GEMINI_API_KEY=your_gemini_api_key_here
```

**Примечание**: 
- Файл `.env` находится в `.gitignore` и не попадает в репозиторий
- **Скопируйте `env.example.txt` в `.env`** (или используйте `make local`) и заполните значения
- Docker Compose автоматически подхватывает переменные из `.env` файла в корне проекта
- Для локальной разработки переменные загружаются через `dotenv` в backend и `vite.config.ts` в frontend
- В Docker переменные прокидываются через секцию `environment` в `docker-compose.yml`
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
1. **Frontend**: Builds React app and serves with Nginx
2. **Backend**: Builds TypeScript and runs Node.js server with SQLite database

All services are orchestrated via Docker Compose.

## 📄 License

Private project - All rights reserved
