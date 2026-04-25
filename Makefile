up:
	docker compose up -d

down:
	docker compose down

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

build:
	docker compose build

test:
	cd backend && npm run test:unit
