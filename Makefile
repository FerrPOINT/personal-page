.PHONY: install migrate typecheck test build check compose-config

install:
	cd backend && npm ci
	cd frontend && npm ci

migrate:
	cd backend && npm run migrate

typecheck:
	cd backend && npx tsc --noEmit
	cd frontend && npx tsc --noEmit

test:
	cd backend && npm test -- --run
	cd frontend && npm run test:run

build:
	cd backend && npm run build
	cd frontend && npm run build

compose-config:
	@if [ -f .env ]; then \
		IMAGE_TAG=local docker compose config >/dev/null; \
	else \
		cp .env.example .env; \
		IMAGE_TAG=local docker compose config >/dev/null; status=$$?; \
		rm -f .env; \
		exit $$status; \
	fi

check: typecheck test build compose-config
