.PHONY: help install dev build test lint clean docker-up docker-down docker-logs

# Default target
help:
	@echo "Available commands:"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start development environment"
	@echo "  make build        - Build all packages"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linters"
	@echo "  make clean        - Clean build artifacts and dependencies"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-logs  - View Docker logs"

# Install dependencies
install:
	npm install
	npm run prepare

# Development
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres mongodb redis elasticsearch
	npm run dev

# Build all packages
build:
	npm run build

# Run tests
test:
	npm test

# Run linters
lint:
	npm run lint

# Clean everything
clean:
	npm run clean
	rm -rf node_modules
	rm -rf packages/*/node_modules
	rm -rf services/*/node_modules
	rm -rf packages/*/dist
	rm -rf services/*/dist
	find . -name "*.log" -type f -delete

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-rebuild:
	docker-compose build --no-cache

# Database commands
db-init:
	docker exec -i proposal-writer-postgres psql -U postgres < scripts/init-db.sql

db-migrate:
	npm run migrate

db-seed:
	npm run seed

# Quick start for new developers
quickstart: install docker-up db-init
	@echo "Development environment is ready!"
	@echo "Access the application at http://localhost:3000"
	@echo "API Gateway is available at http://localhost:8080"