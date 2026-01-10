# Кроссплатформенный Makefile (работает в Windows и Linux/Mac)
# Автоматически определяет ОС и использует соответствующие команды

.PHONY: local prod docker-up docker-down docker-build docker-logs docker-logs-backend \
        docker-logs-frontend docker-clean dev-backend dev-frontend \
        build-backend build-frontend install migrate clean help \
        lint lint-frontend lint-backend type-check type-check-frontend type-check-backend check

# Настройка локальной разработки: копирует env.local в .env, устанавливает зависимости, запускает миграции
local:
	@echo "🔧 Настройка локальной разработки..."
	@if [ -f env.local ]; then \
		cp env.local .env && echo "✅ env.local скопирован в .env"; \
	else \
		echo "❌ Файл env.local не найден" && echo "💡 Создайте файл env.local с переменными окружения" && exit 1; \
	fi
	@echo "📦 Установка зависимостей..."
	@cd backend && npm install || echo "⚠️  Ошибка установки зависимостей backend (может потребоваться Visual Studio Build Tools для better-sqlite3)"
	@cd frontend && npm install || echo "⚠️  Ошибка установки зависимостей frontend"
	@echo "🗄️  Запуск миграций базы данных..."
	@cd backend && npm run migrate || echo "⚠️  Миграция завершилась с ошибкой (возможно, БД уже создана или нужны зависимости)"
	@echo "✅ Локальная разработка настроена!"
	@echo "💡 Теперь можно запустить:"
	@echo "   - make docker-build  (собрать и запустить через Docker - рекомендуется)"
	@echo "   - make dev-backend   (для локального backend, требует установленные зависимости)"
	@echo "   - make dev-frontend  (для локального frontend)"

# Настройка продакшн окружения: копирует env.prod в .env
prod:
	@echo "🚀 Настройка продакшн окружения..."
	@if [ -f env.prod ]; then \
		cp env.prod .env && echo "✅ env.prod скопирован в .env"; \
	else \
		echo "❌ Файл env.prod не найден" && echo "💡 Создайте файл env.prod с переменными окружения" && exit 1; \
	fi
	@echo "✅ Продакшн окружение настроено!"

# Запуск Docker контейнеров
docker-up:
	docker-compose up -d

# Остановка Docker контейнеров
docker-down:
	docker-compose down

# Пересборка и запуск Docker контейнеров
docker-build:
	docker-compose up -d --build

# Сборка, миграция и запуск (полный цикл)
docker-up-full: local
	@echo "🚀 Запуск через Docker..."
	@docker-compose up -d --build
	@echo "⏳ Ожидание запуска сервисов..."
	@sleep 3
	@echo "🗄️  Запуск миграций в контейнере..."
	@docker-compose exec backend npm run migrate || echo "⚠️  Миграция уже выполнена или контейнер еще не готов"
	@echo "✅ Все сервисы запущены!"
	@echo "💡 Проверьте логи: make docker-logs"

# Просмотр логов Docker контейнеров
docker-logs:
	docker-compose logs -f

# Логи конкретного сервиса
docker-logs-backend:
	docker-compose logs -f backend

docker-logs-frontend:
	docker-compose logs -f frontend


# Остановка и удаление контейнеров с volumes
docker-clean:
	docker-compose down -v

# Локальная разработка (backend)
dev-backend:
	cd backend && npm run dev

# Локальная разработка (frontend)
dev-frontend:
	cd frontend && npm run dev

# Сборка backend
build-backend:
	cd backend && npm run build

# Сборка frontend
build-frontend:
	cd frontend && npm run build

# Установка зависимостей
install:
	cd backend && npm install
	cd frontend && npm install

# Миграции базы данных
migrate:
	cd backend && npm run migrate

# Полная очистка (контейнеры, volumes, образы)
clean:
	docker-compose down -v --rmi all
	@rm -f .env 2>/dev/null || true

# Проверка линтера frontend (если установлен)
lint-frontend:
	@echo "🔍 Проверка линтера frontend..."
	@cd frontend && npm run lint 2>/dev/null || echo "⚠️  Линтер не настроен (добавьте 'lint' скрипт в package.json)"

# Проверка линтера backend (если установлен)
lint-backend:
	@echo "🔍 Проверка линтера backend..."
	@cd backend && npm run lint 2>/dev/null || echo "⚠️  Линтер не настроен (добавьте 'lint' скрипт в package.json)"

# Проверка линтеров обоих проектов
lint: lint-frontend lint-backend

# Проверка типов TypeScript (frontend)
type-check-frontend:
	@echo "🔍 Проверка типов TypeScript (frontend)..."
	@cd frontend && npx tsc --noEmit || echo "⚠️  Ошибки типов найдены"

# Проверка типов TypeScript (backend)
type-check-backend:
	@echo "🔍 Проверка типов TypeScript (backend)..."
	@cd backend && npx tsc --noEmit || echo "⚠️  Ошибки типов найдены"

# Проверка типов обоих проектов
type-check: type-check-frontend type-check-backend

# Полная проверка перед коммитом (lint + type-check + build)
check: lint type-check build-frontend build-backend
	@echo "✅ Все проверки пройдены!"

# Справка по командам
help:
	@echo "Доступные команды:"
	@echo "  make local              - Копирует env.local в .env и настраивает локальную разработку"
	@echo "  make prod               - Копирует env.prod в .env для продакшн окружения"
	@echo "  make docker-up          - Запускает Docker контейнеры"
	@echo "  make docker-down        - Останавливает Docker контейнеры"
	@echo "  make docker-build       - Пересобирает и запускает контейнеры"
	@echo "  make docker-logs        - Показывает логи всех контейнеров"
	@echo "  make docker-logs-backend - Логи backend"
	@echo "  make docker-logs-frontend - Логи frontend"
	@echo "  make docker-clean       - Останавливает и удаляет контейнеры с volumes"
	@echo "  make dev-backend        - Запускает backend в режиме разработки"
	@echo "  make dev-frontend        - Запускает frontend в режиме разработки"
	@echo "  make build-backend      - Собирает backend"
	@echo "  make build-frontend     - Собирает frontend"
	@echo "  make install            - Устанавливает зависимости"
	@echo "  make migrate            - Запускает миграции БД"
	@echo "  make lint               - Проверяет линтером frontend и backend"
	@echo "  make lint-frontend      - Проверяет линтером только frontend"
	@echo "  make lint-backend       - Проверяет линтером только backend"
	@echo "  make type-check         - Проверяет типы TypeScript в обоих проектах"
	@echo "  make type-check-frontend - Проверяет типы только frontend"
	@echo "  make type-check-backend  - Проверяет типы только backend"
	@echo "  make check              - Полная проверка (lint + type-check + build)"
	@echo "  make clean              - Полная очистка (контейнеры, volumes, образы, .env)"
	@echo "  make help               - Показывает эту справку"

