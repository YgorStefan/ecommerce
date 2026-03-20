# =============================================================================
# Makefile — E-commerce Docker Utilities
# =============================================================================
# Comandos utilitários para gerenciar o ambiente Docker do projeto.
# Use `make <comando>` para executar. Ex: make dev
#
# NOTA para Windows: instale o Make via Chocolatey: choco install make
# =============================================================================

.PHONY: dev prod rebuild down logs ps clean nuke

# Exporta BUILD_DATE e GIT_HASH para que o docker-compose.yml os injete como
# build args, quebrando o cache de forma controlada a cada chamada de rebuild/prod.
export BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date /T)
export GIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "no-git")

## dev: Sobe o ambiente de desenvolvimento com hot-reload
dev:
	docker compose -f docker-compose.dev.yml up --build

## prod: Builda e sobe o ambiente de produção (invalida cache via BUILD_DATE)
prod:
	docker compose build --build-arg BUILD_DATE=$(BUILD_DATE) --build-arg GIT_HASH=$(GIT_HASH)
	docker compose up -d

## rebuild: Reset TOTAL — derruba tudo, remove imagens e volumes órfãos, rebuilda do zero
## Use quando hot-reload parar de funcionar ou deps mudarem drasticamente.
rebuild:
	docker compose down --remove-orphans
	docker compose -f docker-compose.dev.yml down --remove-orphans
	docker image rm -f ecommerce-backend ecommerce-frontend 2>/dev/null || true
	docker system prune -f
	docker compose -f docker-compose.dev.yml up --build

## down: Derruba os containers de produção sem apagar volumes de dados
down:
	docker compose down --remove-orphans

## down-dev: Derruba os containers de desenvolvimento sem apagar volumes de dados
down-dev:
	docker compose -f docker-compose.dev.yml down --remove-orphans

## logs: Exibe logs em tempo real de todos os serviços (produção)
logs:
	docker compose logs -f

## logs-dev: Exibe logs em tempo real de todos os serviços (desenvolvimento)
logs-dev:
	docker compose -f docker-compose.dev.yml logs -f

## ps: Lista os containers em execução com status de saúde
ps:
	docker compose ps

## clean: Remove imagens buildadas localmente sem apagar volumes de dados
clean:
	docker compose down --remove-orphans
	docker image rm -f ecommerce-backend ecommerce-frontend 2>/dev/null || true
	docker builder prune -f

## nuke: ⚠️  DESTRUTIVO — Remove TUDO: containers, imagens, volumes e cache de build
## Use somente se quiser começar do absoluto zero (perde dados do banco!)
nuke:
	docker compose down -v --remove-orphans
	docker compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -af --volumes
