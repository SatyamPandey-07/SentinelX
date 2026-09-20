.PHONY: help dev down test build clean integration-test chaos-test docker-build k8s-validate k8s-dev k8s-prod frontend-dev frontend-build frontend-typecheck

JAVA_SERVICES := api-gateway auth-service incident-service assignment-service location-service sla-service search-service realtime-service notification-service analytics-service audit-service

help:
	@echo "SentinelX Distributed Emergency Response Platform"
	@echo "================================================="
	@echo "make dev              - Start all infra services via Docker Compose"
	@echo "make down             - Stop all Docker Compose services"
	@echo "make build            - Compile all Java modules and build packages"
	@echo "make test             - Run unit tests across Java and Python services"
	@echo "make frontend-dev     - Start Next.js frontend development server"
	@echo "make frontend-build   - Build Next.js frontend for production"
	@echo "make frontend-typecheck - Run TypeScript typecheck on frontend"
	@echo "make integration-test - Run end-to-end integration tests"
	@echo "make chaos-test       - Execute resilience and chaos engineering script"
	@echo "make docker-build     - Build every service's Docker image (12 images)"
	@echo "make k8s-validate     - Render both K8s overlays without applying (kustomize build)"
	@echo "make k8s-dev          - Apply the dev K8s overlay to the current kubectl context"
	@echo "make k8s-prod         - Apply the prod K8s overlay to the current kubectl context"
	@echo "make clean            - Clean build artifacts"

# --env-file is required: compose resolves .env relative to the compose
# file's own directory (infrastructure/docker/), not the repo root where
# .env actually lives — without this flag, every ${VAR:-default}
# interpolation (JWT_SECRET, ANTHROPIC_API_KEY, GROQ_API_KEY, ...) silently
# falls back to its default/empty value instead of reading .env.
dev:
	docker compose --env-file .env -f infrastructure/docker/docker-compose.yml up -d

down:
	docker compose --env-file .env -f infrastructure/docker/docker-compose.yml down

build:
	mvn clean package -DskipTests

test:
	mvn test
	pytest services/ai-service/tests

frontend-dev:
	npm run dev --prefix frontend

frontend-build:
	npm run build --prefix frontend

frontend-typecheck:
	npx tsc --noEmit --project frontend/tsconfig.json

integration-test:
	python tests/e2e/test_incident_lifecycle.py

chaos-test:
	python scripts/chaos_test.py

docker-build:
	for svc in $(JAVA_SERVICES); do \
		docker build -f services/$$svc/Dockerfile -t sentinelx/$$svc:latest . || exit 1; \
	done
	docker build -f services/ai-service/Dockerfile -t sentinelx/ai-service:latest services/ai-service

# kustomize's base/overlay layout here has overlays reference `../../base`,
# which plain `kubectl kustomize`/`kubectl apply -k` refuses by default
# (its stricter root-restriction disallows paths outside the overlay's own
# directory tree) — --load-restrictor LoadRestrictionsNone is required.
k8s-validate:
	kubectl kustomize --load-restrictor LoadRestrictionsNone infrastructure/kubernetes/overlays/dev >/dev/null
	kubectl kustomize --load-restrictor LoadRestrictionsNone infrastructure/kubernetes/overlays/prod >/dev/null
	@echo "Both overlays render cleanly."

k8s-dev:
	kubectl kustomize --load-restrictor LoadRestrictionsNone infrastructure/kubernetes/overlays/dev | kubectl apply -f -

k8s-prod:
	kubectl kustomize --load-restrictor LoadRestrictionsNone infrastructure/kubernetes/overlays/prod | kubectl apply -f -

clean:
	mvn clean
	docker compose --env-file .env -f infrastructure/docker/docker-compose.yml down -v
