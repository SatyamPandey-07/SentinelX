.PHONY: help dev down test build clean integration-test chaos-test

help:
	@echo "SentinelX Distributed Emergency Response Platform"
	@echo "================================================="
	@echo "make dev              - Start all infra services via Docker Compose"
	@echo "make down             - Stop all Docker Compose services"
	@echo "make build            - Compile all Java modules and build packages"
	@echo "make test             - Run unit tests across Java and Python services"
	@echo "make integration-test - Run end-to-end integration tests"
	@echo "make chaos-test       - Execute resilience and chaos engineering script"
	@echo "make clean            - Clean build artifacts"

dev:
	docker compose -f infrastructure/docker/docker-compose.yml up -d

down:
	docker compose -f infrastructure/docker/docker-compose.yml down

build:
	mvn clean package -DskipTests

test:
	mvn test
	pytest services/ai-service/tests

integration-test:
	python tests/e2e/test_incident_lifecycle.py

chaos-test:
	python scripts/chaos_test.py

clean:
	mvn clean
	docker compose -f infrastructure/docker/docker-compose.yml down -v
