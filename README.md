# Personal Portfolio - Aleksandr Zhukov

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Jenkins-orange)](https://www.jenkins.io/)

Senior Software Architect portfolio website with full internationalization (i18n), 3D graphics, and automated CI/CD pipeline.

## ✨ Features

- 🌍 **Full Internationalization (i18n)**: Russian and English language support with automatic detection
- 🎨 **3D Interactive Background**: Three.js powered solar system visualization
- 📱 **Responsive Design**: Mobile-first approach with modern UI/UX
- 🚀 **CI/CD Pipeline**: Automated deployment via Jenkins with pollSCM (10-minute intervals)
- 🔒 **Security**: Rate limiting, CORS, input sanitization, Helmet.js protection
- 📊 **Real-time Analytics**: Contact form with Telegram notifications
- 🐳 **Dockerized**: Full containerization with Docker Compose
- ⚡ **Performance**: Optimized builds, code splitting, lazy loading

## 🏗️ Project Structure

```
personal-page/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Hero.tsx        # Hero section with 3D background
│   │   │   ├── Navbar.tsx      # Navigation with language switcher
│   │   │   ├── Projects.tsx    # Featured projects showcase
│   │   │   ├── Experience.tsx  # Professional experience
│   │   │   ├── TechStack.tsx   # Technical skills visualization
│   │   │   ├── Insights.tsx     # Blog posts/articles
│   │   │   ├── Contact.tsx     # Contact form with resume
│   │   │   └── LanguageSwitcher.tsx  # Language toggle component
│   │   ├── i18n/               # Internationalization system
│   │   │   ├── context/        # Language context provider
│   │   │   ├── hooks/          # useLanguage hook
│   │   │   ├── translations/   # Translation files (ru.json, en.json)
│   │   │   └── utils/          # Language detection & utilities
│   │   ├── constants/          # Application constants
│   │   ├── types/              # TypeScript type definitions
│   │   ├── App.tsx             # Main application component
│   │   └── main.tsx            # Application entry point
│   ├── public/                 # Static assets
│   ├── Dockerfile              # Frontend Docker image
│   ├── nginx.conf              # Nginx configuration
│   └── package.json
│
├── backend/                    # Backend API + Worker
│   ├── src/
│   │   ├── routes/             # API routes
│   │   │   └── contact.ts      # Contact form endpoint
│   │   ├── services/           # Business logic
│   │   │   ├── database.ts     # SQLite operations
│   │   │   ├── telegram.ts     # Telegram bot service
│   │   │   └── validation.ts  # Input validation
│   │   ├── models/             # Data models
│   │   │   ├── Message.ts      # Message model
│   │   │   └── BotSettings.ts  # Bot settings model
│   │   ├── workers/            # Background workers
│   │   │   └── telegram-worker.ts  # Telegram notification worker
│   │   └── index.ts            # Server entry point
│   ├── db/
│   │   ├── migrate.ts          # Migration runner
│   │   └── migrations/         # Database migrations
│   ├── Dockerfile              # Backend Docker image
│   └── package.json
│
├── scripts/                    # Automation scripts
│   ├── deploy.sh               # Deployment script
│   ├── setup-jenkins-*.sh     # Jenkins setup scripts
│   ├── setup-jenkins-timezone.sh  # Timezone configuration
│   └── verify-*.sh            # Verification scripts
│
├── info/                       # Project documentation
│   ├── deployment-guide.qmd   # Deployment instructions
│   ├── jenkins-*.qmd          # Jenkins documentation
│   └── sprint1/               # Sprint documentation
│
├── docker-compose.yml         # Docker Compose configuration
├── Jenkinsfile                # CI/CD pipeline definition
├── Makefile                   # Cross-platform build automation
└── README.md                  # This file

```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+ (recommended v20+)
- **npm**: v9+ or **yarn** v1.22+
- **Docker**: v20+ and **Docker Compose** v2+ (for production)
- **Git**: for repository management

### Development Setup

#### 1. Clone Repository

```bash
git clone <repository-url>
cd personal-page
```

#### 2. Environment Configuration

```bash
# Copy environment template
make local

# Or manually:
cp env.local .env

# Edit .env and fill in required values
```

#### 3. Install Dependencies

```bash
make install

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

#### 4. Database Migration

```bash
make migrate

# Or manually:
cd backend && npm run migrate
```

#### 5. Start Development Servers

**Option A: Docker (Recommended)**

```bash
make docker-build
# Services available at:
# - Frontend: http://localhost:8888
# - Backend: http://localhost:9000
```

**Option B: Local Development**

```bash
# Terminal 1: Backend
make dev-backend
# Backend: http://localhost:9000

# Terminal 2: Frontend
make dev-frontend
# Frontend: http://localhost:5173 (or 8889 if 5173 is busy)
```

### Production Build

```bash
# Build and start all services
make docker-build

# View logs
make docker-logs

# Stop services
make docker-down
```

## 📦 Technologies

### Frontend

- **React 19.2** - Modern UI library with concurrent features
- **TypeScript 5.8** - Type safety and developer experience
- **Vite 6.2** - Next-generation build tool and dev server
- **Three.js** - 3D graphics via @react-three/fiber
- **Framer Motion 12.23** - Smooth animations and transitions
- **Recharts 3.5** - Data visualization and charts
- **React Hook Form 7.67** - Form management
- **Lucide React** - Modern icon library
- **Nginx** - Production web server

### Backend

- **Node.js 20+** - JavaScript runtime
- **Express 4.18** - Web framework
- **TypeScript 5.3** - Type safety
- **SQLite** - Database (via better-sqlite3)
- **Telegram Bot API** - Real-time notifications
- **Helmet.js 7.1** - Security headers
- **express-rate-limit 7.1** - Rate limiting protection
- **CORS** - Cross-origin resource sharing

### DevOps & Infrastructure

- **Docker & Docker Compose** - Containerization
- **Jenkins** - CI/CD automation
- **Nginx** - Reverse proxy and static file serving
- **Git** - Version control

## 🌍 Internationalization (i18n)

The application supports full internationalization with automatic language detection:

### Supported Languages

- **English (en)** - Default language
- **Russian (ru)** - Full translation

### Features

- **Automatic Detection**: Detects browser language via `navigator.language`
- **LocalStorage Persistence**: Saves user language preference
- **Language Switcher**: Manual language toggle in navigation
- **Dynamic Content**: All content (projects, experience, blog posts) is translatable
- **Fallback Support**: Falls back to English if translation key is missing

### Implementation

- **Context-based**: React Context API for language state management
- **Hook-based**: `useLanguage()` hook for easy access
- **Type-safe**: TypeScript support for translation keys
- **Performance**: `useCallback` optimization for translation function

### Adding New Languages

1. Create new translation file: `frontend/src/i18n/translations/{lang}.json`
2. Add language to `Language` type in `languageDetector.ts`
3. Update language switcher component

## 🔧 Configuration

### Environment Variables

**Important**: Use a single `.env` file in the project root. Do not create `.env` files in `backend/` or `frontend/`.

Create `.env` file in project root:

```env
# Database (SQLite)
DATABASE_PATH=./data/database.db

# Telegram Bot (optional - worker won't start without token)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Backend API Configuration
API_PORT=9000
NODE_ENV=development
FRONTEND_URL=http://localhost:8888,http://localhost:5173

# Frontend API Configuration
# VITE_API_URL not needed for production - uses relative path /api
# For local dev: VITE_API_URL=http://localhost:9000/api
# VITE_API_URL=http://localhost:9000/api

# Gemini API (if needed)
GEMINI_API_KEY=your_gemini_api_key_here
```

**Notes**:
- `.env` is in `.gitignore` and not committed to repository
- Copy `env.local` to `.env` (or use `make local`)
- Docker Compose automatically loads variables from root `.env`
- For production: `VITE_API_URL` not needed - app uses relative path `/api`

### Telegram Bot Setup

1. **Get Bot Token**:
   - Open Telegram, search for `@BotFather`
   - Send `/newbot` command
   - Follow instructions to create a bot
   - Copy the token you receive

2. **Register User ID** (automatic):
   - Start backend server
   - Send ANY message to your bot in Telegram
   - Bot automatically saves your User ID
   - You'll receive confirmation message

## 🏭 CI/CD Pipeline

### Jenkins Configuration

The project includes automated CI/CD via Jenkins:

- **Pipeline**: Defined in `Jenkinsfile`
- **Trigger**: `pollSCM` every 10 minutes (checks for changes in main branch)
- **Deployment**: Automated SSH deployment to production server
- **Timezone**: Configured for Asia/Novosibirsk (UTC+7)

### Jenkins Setup Scripts

```bash
# Setup Jenkins timezone
./scripts/setup-jenkins-timezone.sh

# Other setup scripts available in scripts/ directory
```

### Pipeline Stages

1. **Checkout**: Clone repository
2. **Validate**: Verify Jenkinsfile exists
3. **Deploy**: SSH to server and run deployment script

### Documentation

- **Quick Start**: `info/jenkins-quickstart.qmd`
- **Full Guide**: `info/jenkins-pipeline.qmd`
- **Setup Guide**: `info/jenkins-cicd-setup-guide.qmd`
- **Quick Reference**: `info/jenkins-quick-reference.qmd`

## 🔒 Security Features

### Backend Security

- **Rate Limiting**: 5 requests per 15 minutes per IP for contact form
- **CORS Protection**: Configured for specific frontend origins
- **Helmet.js**: Security headers (XSS, clickjacking, MIME-sniffing)
- **Input Sanitization**: HTML tags and control characters removed
- **Request Size Limit**: 1MB body size limit to prevent DoS
- **SQL Injection Protection**: Parameterized queries via better-sqlite3

### Frontend Security

- **Content Security Policy**: Configured via Nginx
- **XSS Protection**: React's built-in escaping
- **HTTPS Ready**: Production-ready SSL/TLS configuration

### Configuration

- Set `FRONTEND_URL` in `.env` for CORS (comma-separated origins)
- Rate limiting adjustable in `backend/src/routes/contact.ts`
- Security headers configured via Helmet.js in `backend/src/index.ts`

## 📝 Scripts

### Makefile Commands

```bash
# Environment Setup
make local              # Copy env.local to .env and setup local dev
make prod               # Copy env.prod to .env for production

# Docker Commands
make docker-up          # Start Docker containers
make docker-down        # Stop Docker containers
make docker-build       # Rebuild and start containers
make docker-logs        # Show all container logs
make docker-logs-backend   # Backend logs only
make docker-logs-frontend  # Frontend logs only
make docker-clean       # Stop and remove containers with volumes

# Local Development
make dev-backend        # Start backend in dev mode
make dev-frontend       # Start frontend in dev mode
make build-backend      # Build backend
make build-frontend     # Build frontend

# Utilities
make install            # Install dependencies for both projects
make migrate            # Run database migrations
make clean              # Full cleanup (containers, volumes, images, .env)
make help               # Show command help
```

### NPM Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │
│   (React + Vite)│────────▶│  (Express API)  │
│   Port: 8888    │  /api   │   Port: 9000    │
│   i18n: ru/en   │         └────────┬────────┘
└─────────────────┘                  │
                                      │
                              ┌───────▼────────┐
                              │   SQLite DB    │
                              │  (./data/*.db) │
                              └────────┬───────┘
                                       │
                              ┌────────▼────────┐
                              │ Telegram Worker │
                              │  (Background)  │
                              └─────────────────┘
```

### Components

- **Frontend**: React SPA with i18n, builds to static files, served via Nginx
- **Backend**: Express API server with REST endpoints
- **Database**: SQLite (file-based DB, created automatically)
- **Worker**: Background process for Telegram notifications
- **CI/CD**: Jenkins pipeline with automated deployment

## 📡 API Documentation

### Health Check

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

### Contact Form

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
- 5 requests per IP per 15 minutes
- HTTP 429 on limit exceeded

## 🗄️ Database Schema

### Messages Table

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

### BotSettings Table

```sql
CREATE TABLE bot_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_user_id TEXT,
  telegram_chat_id TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Migrations:**
- Located in `backend/db/migrations/`
- Run: `npm run migrate` (in backend) or `make migrate`
- Executed automatically on first startup

## 🛠️ Development Guide

### Development Workflow

#### 1. First Time Setup

```bash
# Clone repository
git clone <repository-url>
cd personal-page

# Setup environment
make local

# Install dependencies
make install

# Run migrations
make migrate

# Start with Docker (recommended)
make docker-build

# Or local development
make dev-backend    # Terminal 1
make dev-frontend   # Terminal 2
```

#### 2. Local Development

**Backend:**
```bash
cd backend
npm run dev  # Hot reload with tsx watch
```

**Frontend:**
```bash
cd frontend
npm run dev  # Vite dev server (usually http://localhost:5173)
```

**Important for Local Dev:**
- Backend: `http://localhost:9000`
- Frontend: Set `VITE_API_URL=http://localhost:9000/api` in `.env`
- CORS configured for `http://localhost:8888` and `http://localhost:5173`

#### 3. Testing Changes

```bash
# Type checking
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit

# Build verification
cd frontend && npm run build
cd backend && npm run build
```

### Code Structure

#### Frontend Structure

```
frontend/src/
├── components/          # React components
│   ├── Hero.tsx         # Hero with 3D background
│   ├── Navbar.tsx       # Navigation with language switcher
│   ├── Projects.tsx     # Projects showcase
│   ├── Experience.tsx   # Professional experience
│   ├── TechStack.tsx    # Skills visualization
│   ├── Insights.tsx     # Blog/articles
│   ├── Contact.tsx      # Contact form
│   └── LanguageSwitcher.tsx  # Language toggle
├── i18n/                # Internationalization
│   ├── context/         # LanguageContext provider
│   ├── hooks/           # useLanguage hook
│   ├── translations/    # ru.json, en.json
│   └── utils/           # Language detection
├── constants/           # App constants
├── types/               # TypeScript types
├── App.tsx              # Main component
└── main.tsx             # Entry point
```

#### Backend Structure

```
backend/src/
├── index.ts             # Express server setup
├── routes/
│   └── contact.ts       # POST /api/contact endpoint
├── services/
│   ├── database.ts      # SQLite operations
│   ├── telegram.ts     # Telegram bot service
│   └── validation.ts   # Input validation
├── models/
│   ├── Message.ts       # Message model
│   └── BotSettings.ts  # Bot settings model
├── workers/
│   └── telegram-worker.ts  # Background worker
└── types/
    └── telegram-bot-api.d.ts
```

## 🐛 Troubleshooting

### Backend Won't Start

**Check:**
1. Port 9000 not in use: `netstat -an | grep 9000` (Linux/Mac) or `netstat -an | findstr 9000` (Windows)
2. `.env` variables are correct
3. Database created: check `./data/database.db`
4. Dependencies installed: `cd backend && npm install`

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run migrate
npm run dev
```

### Frontend Can't Connect to Backend

**Check:**
1. Backend running at `http://localhost:9000`
2. `VITE_API_URL=http://localhost:9000/api` in `.env`
3. CORS configured (check `FRONTEND_URL` in backend `.env`)
4. Browser console for errors (F12)

**Solution:**
```bash
# Test backend
curl http://localhost:9000/health

# Test API
curl -X POST http://localhost:9000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Test message"}'
```

### Telegram Bot Not Sending Messages

**Check:**
1. `TELEGRAM_BOT_TOKEN` set and valid
2. Bot started and responding
3. User ID registered (send message to bot)
4. Backend logs show Telegram connection

**Solution:**
```bash
# Test token
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"

# Check logs
make docker-logs-backend
```

### Docker Containers Won't Start

**Solution:**
```bash
# Check logs
make docker-logs

# Rebuild from scratch
make docker-clean
make docker-build

# Check ports
docker ps
netstat -an | grep 8888
netstat -an | grep 9000
```

### i18n Issues

**Check:**
1. Translation files exist: `frontend/src/i18n/translations/ru.json`, `en.json`
2. Language context provider wraps app in `App.tsx`
3. Browser console for missing translation keys

**Solution:**
```bash
# Verify translation files
ls -la frontend/src/i18n/translations/

# Check for missing keys
cd frontend && npm run build
```

## 📊 Performance

### Optimization Features

- **Code Splitting**: Dynamic imports for large components
- **Lazy Loading**: React.lazy for route-based splitting
- **Image Optimization**: Optimized assets and lazy loading
- **Bundle Size**: Tree shaking and minification
- **Caching**: Browser caching via Nginx headers

### Metrics

- **Initial Load**: < 2s (3G connection)
- **Time to Interactive**: < 3s
- **Bundle Size**: ~2.2MB (gzipped: ~630KB)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices)

## 🌐 Browser Support

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## 📚 Additional Resources

- **Project Documentation**: `info/` directory
- **Deployment Guide**: `info/deployment-guide.qmd`
- **Sprints & Tasks**: `info/sprint1/`
- **Jenkins Documentation**: `info/jenkins-*.qmd`
- **API Examples**: See `backend/src/routes/contact.ts`

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Ensure code passes type checking and linting
4. Create commit with clear message
5. Push and create Pull Request

**Code Style:**
- TypeScript strict mode
- ESLint/Prettier (if configured)
- Comments for complex logic
- Naming: camelCase for variables, PascalCase for components/classes
- Follow existing code patterns

## 📄 License

Private project - All rights reserved

## 👤 Author

**Aleksandr Zhukov**
- Senior Software Architect
- Portfolio: [azhukov-dev.ru](https://azhukov-dev.ru)
- Email: ferruspoint@mail.ru

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
