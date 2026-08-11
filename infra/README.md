# infra/

Reservado para infraestrutura futura do FloodGuard: Dockerfiles de produção,
pipelines de CI, configuração de deploy e proxy reverso.

Na F1, toda a infraestrutura de desenvolvimento local vive no
`docker-compose.yml` da raiz do projeto — banco PostGIS, API e frontend
rodando com imagens genéricas (`python:3.12-slim`, `node:20-slim`), sem
Dockerfile próprio ainda.
