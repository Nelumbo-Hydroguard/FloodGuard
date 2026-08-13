# Relatório Geral do Projeto FloodGuard

> Gerado na F5.0 (auditoria/documentação), base `feat/f4-dashboard-api`
> commit `3c0013b`. Nada aqui é especulação — cada afirmação está ancorada
> em arquivo real do repositório, citado entre parênteses.
>
> **Atualização F6:** as seções 8, 13, 18 e 19 abaixo citam ausência de
> Leaflet e `/mapa` sem cartografia como achado/pendência — isso foi
> corrigido na F6 (mapa Leaflet real + fallback estático geoespacial, ver
> [README.md](../README.md#f6--identidade-visual-mapa-funcional-e-backend-de-demo)).
> Mantido abaixo como registro histórico do estado na F5, não editado
> ponto a ponto para não distorcer o que foi auditado naquele momento.
>
> **Atualização F7:** as seções 8, 10 e 13 abaixo listam `alerts.py` e
> `shelters.py` como placeholder e `/alertas`/`/abrigos` como pendentes de
> API real — isso foi corrigido na F7 (`GET /api/alerts/demo`,
> `/api/alerts/demo/{id}`, `GET /api/shelters/demo`, ambos simulados e sem
> persistência, ver [README.md](../README.md#f7--alertas-e-abrigos-simulados)).
> Idem: não editado ponto a ponto abaixo.
>
> **Atualização F9.1 (estado atual do projeto):** a tabela da seção 7
> ("Estado atual por fase") para em F5 e não reflete F6–F9.1 — todas
> concluídas, ver [README.md](../README.md). Em particular, a pendência do
> F4 ("`/mapa` não renderiza cartografia, sem Leaflet instalado") está
> **corrigida desde a F6** e o mapa hoje também mostra alertas simulados
> clicáveis com destaque no nível crítico (F9.1, ver
> [docs/auditoria-mapa-benvenutti-f9-1.md](auditoria-mapa-benvenutti-f9-1.md)).
> Total de testes de backend hoje: **67/67**. Repositório hospedado em
> `github.com/Nelumbo-Hydroguard/FloodGuard`. Idem: tabela da seção 7 não
> editada ponto a ponto, mantida como registro histórico da F5.

## 1. Visão executiva

FloodGuard é um painel web que ajuda uma Defesa Civil municipal a decidir
o que fazer diante de risco de alagamento/inundação. Ele pega três coisas —
a topografia do terreno (suscetibilidade HAND), chuva acumulada e nível
d'água — e devolve um score de risco explicado em português, com uma ação
recomendada. Hoje é uma **Prova de Conceito (PoC)**: os dados de sensor são
simulados por software, não há hardware real, e o motor de risco usa pesos
fixos e documentados, não calibrados com histórico real de enchentes.

## 2. Escopo geral

Plataforma **GovTech B2G** (vendida/entregue a órgãos públicos, não ao
cidadão diretamente), para **Defesa Civil municipal**, com piloto em
**Blumenau/SC** (`README.md`, `docs/decisoes-arquitetura.md`). Foco: apoio
à tomada de decisão em eventos de alagamento e inundação urbana — não é um
sistema de resposta automática a emergências.

## 3. Usuários e stakeholders

| Stakeholder | Papel no projeto |
|---|---|
| Defesa Civil municipal | Usuário operacional primário — consome `/painel`, `/alertas`, `/mapa` |
| Operador/coordenador da Defesa Civil | Avalia risco, decide ação, é quem o `recommended_action` do motor se dirige |
| Prefeitura | Contratante em cenário B2G real (fora do escopo técnico atual) |
| Cidadão em área de risco | Visão mínima planejada — hoje só placeholder (`/abrigos`, `docs/roadmap.md`) |
| Equipe acadêmica (João Benvenutti, Nyrx Oliveira, Pedro Zanette) | Autoria coletiva do consolidado (`docs/autoria-licenca.md`) |
| Avaliadores/professores | Público da demo e da documentação gerada nesta fase |

## 4. Problema que o projeto resolve

Hoje, dados relevantes para decisão em enchente ficam fragmentados: mapa de
suscetibilidade num lugar, chuva noutro, nível de rio noutro, sem
cruzamento automático. Isso atrasa a priorização de área e a resposta.
FloodGuard tenta resolver isso cruzando os três fatores numa única
avaliação explicável, dando **inteligência territorial** (contexto
espacial + dado dinâmico) num único painel, em vez de o operador ter que
cruzar mentalmente informações de fontes separadas.

## 5. Solução proposta

Arquitetura **software-only e hardware-agnóstica** (`docs/decisoes-arquitetura.md`):

- **Backend FastAPI** (`services/api/`) — API REST, motor de risco, normalização de telemetria.
- **Frontend React + Vite + Tailwind** (`apps/web/`) — dashboard operacional.
- **Motor de risco** (`services/api/app/engine/`) — fusão HAND + chuva + nível d'água + tendência.
- **Dados HAND** (`data/hand/`) — suscetibilidade topográfica real de Blumenau.
- **PostGIS** (`db/migrations/`) — banco espacial, schema pronto, ainda não populado localmente.
- **Telemetria simulada** (`services/simulator/`, `telemetry_normalizer.py`) — sem sensor físico.
- **Dashboard operacional** (`apps/web/src/pages/`) — painel, mapa, alertas, telemetria, sobre.

## 6. Arquitetura atual

```
Dados geoespaciais (HAND, repositório externo)
        ↓ (copiado, artefatos leves)
data/hand/*.gpkg, *.png, *.json
        ↓ (services/geo/scripts/export_to_postgis.py — não executado localmente)
Banco espacial (PostgreSQL + PostGIS, db/migrations/*.sql)
        ↓ (SQL cru via SQLAlchemy)
API FastAPI (services/api/app/) — routers geo/risk/telemetry/scenarios/alerts/shelters/health
        ↓ (fetch)
Motor de risco (services/api/app/engine/) — roda sem depender do banco
        ↓ (JSON)
Dashboard React (apps/web/) — /painel /mapa /alertas /telemetria /sobre /abrigos
        ↑
Documentação (docs/*.md) — decisões, metodologia, roadmap, limitações
Infraestrutura (docker-compose.yml, infra/, scripts/dev/) — orquestra tudo acima
```

Simulador de telemetria (`services/simulator/`) hoje é só um exemplo de
payload (`simulated_payload_example.json`) e a lógica de normalização
embutida no backend (`telemetry_normalizer.py`) — não é um processo
separado rodando.

## 7. Estado atual por fase

| Fase | Status | Arquivos principais | Validado | Pendências |
|---|---|---|---|---|
| F0 — documentação inicial | ✅ Concluída | `docs/decisoes-arquitetura.md`, `docs/autoria-licenca.md`, `docs/roadmap.md`, `docs/limitacoes.md` | Decisões registradas e coerentes com o código atual | — |
| F1 — estrutura do monorepo | ✅ Concluída | `docker-compose.yml`, `.env.example`, `services/api/app/main.py`, `apps/web/` (esqueleto) | `npm run build` e estrutura de pastas | Dockerfiles próprios não existem (usa imagens genéricas) |
| F2 — artefatos HAND | ✅ Concluída | `data/hand/*.gpkg`, `services/geo/scripts/export_to_postgis.py`, `db/migrations/003_hand_layers.sql` | Percentuais de área das 4 classes conferem com `americas_techguard_final_poc` (histórico) | Export não foi rodado contra um Postgres real nesta sessão |
| F2.1 — validação PostGIS | ⚠️ Bloqueada | `db/migrations/*.sql` | Sintaxe SQL validada num Postgres local descartável (sem extensão PostGIS) | Sem acesso a Docker (usuário fora do grupo `docker`) nem `sudo` — `GEOMETRY(...)`/`GIST` nunca exercitados contra PostGIS real |
| F3 — motor de risco | ✅ Concluída | `services/api/app/engine/*.py`, `services/api/tests/*.py` | **27/27 testes unitários passando, sem banco** | Fórmula é PoC, não calibrada; motor completo do `techguard-sentinela` (NDVI/NDBI/Tc) não foi portado |
| F4 — dashboard conectado à API | ✅ Concluída | `apps/web/src/pages/*.tsx`, `apps/web/src/lib/api.ts` | Validado localmente: backend+frontend rodando, `/painel` consumindo `/scenarios/demo`, `/telemetria` postando `/risk/evaluate` | `/mapa` não renderiza cartografia (sem Leaflet instalado); `/api/geo/*` falha sem PostGIS |
| F5 — documentação/relatórios | 🔄 Em execução (esta fase) | `docs/relatorio-geral-floodguard.md`, `docs/arvore-arquivos-floodguard.md` | Baseado em leitura completa do repositório | — |

## 8. Funcionalidades implementadas

O que **de fato funciona hoje**, sem PostGIS:

- `GET /health`, `GET /api/risk/status`, `GET /api/scenarios/status`, `GET /api/telemetry/status`, `GET /api/alerts/status`, `GET /api/shelters/status`, `GET /api/geo/status` (`services/api/app/routers/`).
- `POST /api/risk/evaluate` e `POST /api/risk/evaluate-batch` — motor de risco real (`risk_engine.py`).
- `GET /api/scenarios/demo` — 3 cenários fixos rodados pelo motor real, não hardcoded (`scenarios.py`).
- `POST /api/telemetry/normalize` — normalização de payload bruto simulado, aceita aliases de campo (`telemetry_normalizer.py`).
- `POST /api/telemetry/mesh-payload` — gera payload UniMesh/LoRa simulado (`mesh_payload.py`).
- **Testes automatizados** cobrindo motor de risco, normalizador, payload mesh e endpoints da API (`services/api/tests/`), todos passando sem banco — eram 27 na F3, **65 na F9**, **67 na F9.1** (F3 + F6 + F7 + regressões da F9 + coordenadas de alerta da F9.1).
- Dashboard: `/painel` (3 cards de risco reais), `/telemetria` (formulário → `POST /risk/evaluate` + geração de payload mesh), `/alertas` (lista derivada de `/scenarios/demo`), `/sobre` (conteúdo estático), `/mapa` com fallback informativo quando PostGIS não está populado.

Com PostGIS configurado (não testado localmente nesta sessão), também
funcionariam: `GET /api/geo/municipality/blumenau`, `/api/geo/basins/blumenau`,
`/api/geo/hand-zones`, `/api/geo/hand-zones/summary`, `/api/geo/point-risk-context`.

## 9. Funcionalidades simuladas

- **Telemetria** — toda leitura de sensor é sintética; `source: "simulation"` e `hardware_implemented: false` em todo payload (`services/simulator/simulated_payload_example.json`).
- **Payload UniMesh/LoRa** — empacotamento simulado, `implemented: false` sempre, mesmo em risco crítico (testado em `test_mesh_payload.py`). Não abre socket, não usa rádio.
- **Cenários** (`/api/scenarios/demo`) — 3 leituras fixas (seguro/alerta/crítico) definidas em `scenarios.py`, não medições reais.
- **Alertas** (`/alertas` no frontend) — derivados dos cenários simulados acima, não emitidos pela Defesa Civil de verdade. Desde a F9.1, os mesmos alertas também aparecem como marcadores clicáveis em `/mapa` (com popup, destaque pulsante no nível crítico, e navegação cruzada `/alertas` ↔ `/mapa?alert=<id>`) — ver `docs/auditoria-mapa-benvenutti-f9-1.md`.

## 10. Funcionalidades pendentes

- PostGIS real rodando localmente (bloqueado por falta de Docker/sudo — F2.1).
- Integração real de dados meteorológicos (hoje é `rainfall_mm` informado manualmente ou por cenário fixo).
- Ingestão real via n8n/API externa — não existe nenhuma integração de ingestão automática no código.
- Autenticação/autorização — nenhum router tem proteção de acesso.
- Persistência de alertas — `alerts.py` é só `{"status": "placeholder"}`; a tabela `alerts` existe (`002_core_tables.sql`) mas nada grava nela.
- CRUD real de abrigos — `shelters.py` idem; tabelas `shelters`/`shelter_requests` existem, sem uso.
- Solicitações reais de cidadãos — sem endpoint de escrita, sem formulário no frontend.
- Calibração do motor de risco com dados reais — pesos e referências são demonstrativos (`docs/motor-de-risco.md`).
- Validação com dados históricos de inundação — não feita.
- Deploy — não há pipeline de CI/CD nem ambiente publicado; só `docker-compose.yml` local.

## 11. Motor de risco

Implementado em `services/api/app/engine/risk_engine.py` + `risk_rules.py`.

**Fórmula:**
```
score = 0.45·hand_risk_weight + 0.30·rainfall_factor + 0.20·water_level_factor + 0.05·trend_factor
```

**Fatores (0–1):** `hand_risk_weight` (peso da classe HAND do ponto);
`rainfall_factor` = chuva acumulada / 150 mm; `water_level_factor` = nível
d'água / 3,0 m; `trend_factor` = 0,5 (neutro) ajustado pela diferença entre
nível atual e anterior.

**Níveis:** 0,00–0,25 `seguro`; 0,26–0,50 `atencao`; 0,51–0,75 `alerta`;
0,76–1,00 `critico`.

**Fallback sem HAND:** se não há `hand_class_id`/`hand_risk_weight` nem
`region`, o peso de 0,45 é redistribuído proporcionalmente entre os 3
fatores restantes, `spatial_context_available: false`, `confidence` cai de
0,95 para 0,55, e a justificativa textual avisa explicitamente.

**Limitações:** pesos e referências (150 mm, 3,0 m) são valores
demonstrativos de PoC, não calibrados com dados reais de campo nem
validados contra eventos históricos (`docs/limitacoes.md`, item 6).

**Por que é o motor canônico do MVP:** é o único motor de risco
implementado e testado no repositório — o motor mais completo do
`techguard-sentinela` (HAND+NDVI+NDBI+chuva efetiva+saturação) está
autorizado para reaproveitamento (`docs/autoria-licenca.md`) mas nunca foi
fisicamente copiado para este código; a F3 optou por uma fórmula própria,
mais simples e já implementada, em vez de depender de um port ainda não
feito (`docs/decisoes-arquitetura.md`, seção "Motor de risco canônico").

## 12. HAND e geoprocessamento

HAND (Height Above Nearest Drainage) mede a altura de um ponto em relação
à drenagem mais próxima — quanto menor, maior a suscetibilidade a
alagamento. É uma variável topográfica **estática**, não incorpora chuva,
vazão, exposição ou vulnerabilidade (`docs/metodologia-hand.md`).

**Como entra no projeto:** pipeline de cálculo roda no repositório externo
`HAND` (não faz parte deste repo). O FloodGuard só consome os artefatos já
publicados — não recalcula HAND.

**Artefatos existentes** (`data/hand/`): limite municipal de Blumenau
(`blumenau_boundary.gpkg`), união de bacias contribuintes
(`ottobacias_blumenau_union.gpkg`), e um **vetor derivado** de 4 zonas de
suscetibilidade (`blumenau_hand_classes_vector.gpkg`, gerado a partir de um
raster de 3 MB via polygonize+dissolve, não o raster original).

**Limitações:** resolução do DEM original ~30 m; classes validadas
apenas por comparação de percentual de área com outra PoC, não por
validação de campo (`docs/metodologia-hand.md`).

**O que depende do PostGIS:** os endpoints `GET /api/geo/*` (exceto
`/status`) só respondem depois que `export_to_postgis.py export-all` for
rodado contra um banco real — isso não foi feito localmente (F2.1
bloqueada).

## 13. Frontend/dashboard

**Rotas** (`apps/web/src/router.tsx`): `/` (Landing), `/painel`, `/mapa`,
`/alertas`, `/alertas/:id`, `/telemetria`, `/abrigos`, `/sobre` — todas
menos `/` dentro de `Layout` (nav fixo).

**Páginas** (`apps/web/src/pages/`): `Dashboard.tsx` (`/painel`),
`RiskMap.tsx` (`/mapa`), `Alertas.tsx`, `AlertDetail.tsx` (placeholder de
detalhe individual), `Telemetria.tsx`, `Shelters.tsx` (placeholder),
`Sobre.tsx`, `Landing.tsx`.

**Componentes** (`apps/web/src/components/`): `Layout.tsx` (nav+shell),
`RiskCard.tsx`, `StatusBadge.tsx`, `FactorBar.tsx` — os 3 últimos criados
na F4 e reutilizados em `/painel`, `/alertas` e `/telemetria`.

**Endpoints consumidos** (`apps/web/src/lib/api.ts`): `/health`,
`/api/geo/status`, `/api/geo/hand-zones/summary`, `/api/risk/status`,
`/api/risk/evaluate`, `/api/scenarios/demo`, `/api/telemetry/mesh-payload`.
Não consumidos ainda pelo frontend: `/api/risk/evaluate-batch`,
`/api/telemetry/normalize`, `/api/geo/municipality/blumenau`,
`/api/geo/basins/blumenau`, `/api/geo/hand-zones`.

**Onde há fallback:** `/mapa` mostra mensagem explícita quando
`/api/geo/hand-zones/summary` falha (PostGIS não populado) — distingue de
API totalmente fora do ar (`RiskMap.tsx`).

**Achado:** `README.md` lista "Leaflet" na stack, mas `apps/web/package.json`
**não tem `leaflet` como dependência**, e nenhum arquivo importa a
biblioteca — `/mapa` hoje é só cards de resumo, sem mapa cartográfico
renderizado. Ver seção 18.

## 14. Backend/API

**Routers** (`services/api/app/routers/`): `health.py` (`/health`, sem
prefixo), `geo.py` (`/api/geo`), `risk.py` (`/api/risk`), `telemetry.py`
(`/api/telemetry`), `scenarios.py` (`/api/scenarios`), `alerts.py`
(`/api/alerts`, placeholder), `shelters.py` (`/api/shelters`, placeholder).

**Schemas** (`services/api/app/schemas/`): `common.py` (`RiskLevel`),
`health.py`, `risk.py` (`RiskEvaluationRequest/Response`, `RiskFactors`,
batch), `telemetry.py` (`TelemetryReading`, `NormalizedTelemetryReading`,
`MeshPayload`), `alerts.py`, `shelters.py`.

**Engine** (`services/api/app/engine/`): `risk_rules.py` (constantes/regras
puras), `risk_engine.py` (orquestrador), `risk_explanation.py`
(justificativa textual), `spatial_context.py` (HAND mockado, sem banco),
`telemetry_normalizer.py`, `mesh_payload.py`.

**Testes** (`services/api/tests/`): `test_risk_engine.py` (8 testes),
`test_risk_api.py` (9, via `TestClient`), `test_telemetry_normalizer.py`
(6), `test_mesh_payload.py` (4) — **27 total, todos passando** sem
PostgreSQL.

**Prefixo `/api`:** todos os routers exceto `health` usam prefixo
`/api/...` (`main.py`). `GET /risk/status` (sem `/api`) retorna 404 —
confirmado nesta sessão via curl.

**Swagger:** `GET /docs` disponível automaticamente via FastAPI, confirmado
funcionando (HTTP 200) na sessão de validação local anterior.

## 15. Dados e artefatos

`data/hand/` (~20 MB total): `blumenau_boundary.gpkg` (252 KB, limite
municipal IBGE), `ottobacias_blumenau_union.gpkg` (148 KB, bacias ANA),
`blumenau_hand_classes_vector.gpkg` (19 MB, 4 zonas HAND vetorizadas —
o maior arquivo do repositório), `hand_classes_stats.json` (<4 KB, área
por classe), `previews/mapa_hand_transparent.png` (700 KB) e
`previews/mapa_suscetibilidade_blumenau.png` (848 KB) — mapas estáticos de
referência.

**O que está no repo:** só os artefatos leves acima. **O que não deve ir
para o repo:** o DEM bruto (~1,5 GB, fica no repositório `HAND` externo),
rasters intermediários, `data/raw/` (regra do `.gitignore`), qualquer
`.tif`/`.tiff` (regra explícita do `.gitignore`).

## 16. Infraestrutura

`docker-compose.yml` (raiz) sobe 3 serviços com **imagens genéricas** (sem
Dockerfile próprio): `postgis/postgis:16-3.4`, `python:3.12-slim` (roda
`pip install` + `uvicorn` no `command`), `node:20-slim` (roda `npm install`
+ `npm run dev` no `command`). Migrations montadas em
`docker-entrypoint-initdb.d` — aplicam automaticamente no primeiro boot do
Postgres.

`infra/README.md` documenta que este diretório está **reservado** para
infraestrutura futura (Dockerfiles de produção, CI, proxy reverso) — hoje
está vazio de conteúdo técnico, só o README.

**Vercel, Supabase:** não há nenhuma configuração, arquivo ou menção a
Vercel ou Supabase em nenhum arquivo do repositório — não fazem parte da
infraestrutura atual (nem sequer como roadmap documentado nos `docs/*.md`
lidos).

**Limitações locais:** usuário de desenvolvimento não está no grupo
`docker` do sistema e não há `sudo` disponível — por isso `docker compose
up` não pôde ser executado nesta máquina (F2.1, README seção
"F2.1 — status da validação end-to-end").

## 17. Segurança, LGPD e privacidade

Não há nenhuma implementação de autenticação, autorização, criptografia
específica ou tratamento formal de dados pessoais no código atual —
nenhum arquivo lido menciona LGPD, hashing de senha em uso real (só
`password_hash VARCHAR` na tabela `users`, sem código que a popule), ou
política de retenção.

Pontos que **vão exigir atenção** quando "solicitação de ajuda do cidadão"
e "localização em tempo real" saírem do roadmap para implementação:
localização de pessoa em situação de risco é dado sensível; nome +
localização de quem pede ajuda é dado pessoal identificável; a tabela
`shelter_requests` já tem campo `requester_name` — se ligada a um
formulário público real, precisa de política de acesso (quem vê o nome:
só operador da Defesa Civil) e de retenção. Nada disso está resolvido no
código hoje — é um risco a endereçar antes de sair da PoC.

## 18. Limitações atuais

**Técnicas:** `/mapa` não renderiza cartografia real (Leaflet não
instalado, ver seção 13); nenhuma tela usa `evaluate-batch`; região dos
alertas simulados é mapeada manualmente no frontend, dependente de o
backend não mudar a região dos cenários fixos sem avisar (`README.md`,
"F4 — dashboard web").

**Acadêmicas:** motor de risco é fórmula própria simplificada, não o motor
completo (NDVI/NDBI/Tc) que a decisão original (`docs/decisoes-arquitetura.md`)
previa portar do `techguard-sentinela`.

**De dados:** pesos e referências de normalização do motor de risco não
calibrados; classes HAND validadas só por comparação de área percentual
entre duas PoCs, não por dado de campo.

**De infraestrutura:** sem Docker funcional nem sudo neste ambiente de
desenvolvimento; sem deploy; sem CI/CD.

**De validação:** endpoints `/api/geo/*` (exceto `/status`) nunca testados
contra PostGIS real nesta sessão — só a sintaxe SQL foi validada num
Postgres descartável sem a extensão PostGIS instalada.

## 19. Roadmap recomendado

| Fase | Foco |
|---|---|
| F5 | Documentação (este relatório + árvore de arquivos) — em andamento |
| F6 | Estabilização da demo — corrigir achados desta auditoria (Leaflet, endpoints não consumidos) antes de nova feature |
| F7 | Integração PostGIS real — desbloquear F2.1, rodar `export_to_postgis.py` de verdade, validar `/api/geo/*` |
| F8 | Deploy — escolher plataforma, criar pipeline, publicar ambiente demo acessível |
| F9 | Integração meteorológica real — substituir chuva informada manualmente por fonte de dados real |
| F10 | U-RNN/nowcasting experimental — entrada opcional futura no `rainfall_factor` (`docs/roadmap.md`) |

## 20. Resumo para apresentação

- FloodGuard: painel de apoio à decisão para Defesa Civil, piloto Blumenau/SC, GovTech B2G.
- Motor de risco explicável: HAND + chuva + nível d'água + tendência → score, nível, justificativa, ação recomendada.
- **67 testes automatizados passando** (estado da F9.1), motor roda sem depender de banco.
- Backend FastAPI + frontend React/Vite/Tailwind, ambos validados rodando localmente.
- 8 telas navegáveis + 404 amigável: landing, painel, mapa, telemetria, alertas, detalhe de alerta, abrigos, sobre — todas consumindo API real, não mock hardcoded.
- Mapa (`/mapa`) com cartografia real (Leaflet): zonas HAND, limite municipal, abrigos e alertas simulados clicáveis, com destaque pulsante no alerta crítico e navegação cruzada com `/alertas` (F6–F9.1).
- 100% software-only: telemetria simulada, payload UniMesh/LoRa simulado (`implemented: false` sempre), zero hardware.
- Autoria coletiva (João Benvenutti, Nyrx Oliveira, Pedro Zanette); F9.1 analisou o projeto `techguard-sentinela` do Benvenutti como referência de UX de mapa/alerta (sem copiar código), documentado em `docs/auditoria-mapa-benvenutti-f9-1.md`.
- Pendências honestas: PostGIS real ainda não validado localmente (falta Docker/sudo neste ambiente), sem autenticação, sem deploy.
