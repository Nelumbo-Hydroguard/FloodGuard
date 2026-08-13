# Plano de Trabalho — FloodGuard

> Documento gerado na F8.0, com base no estado real do repositório na main
> (commit `79d6de2`, F7 integrada). Todas as afirmações técnicas remetem a
> arquivo de código ou documentação existente no projeto — nada aqui
> descreve funcionalidade que não esteja implementada ou explicitamente
> marcada como roadmap.

## Resumo

FloodGuard é uma Prova de Conceito (PoC) de plataforma **GovTech B2G**
(vendida/entregue a órgãos públicos, não ao cidadão diretamente) de apoio à
tomada de decisão da Defesa Civil municipal em eventos de alagamento e
inundação urbana, com piloto em Blumenau/SC. A plataforma cruza
suscetibilidade topográfica real (modelo HAND, calculado sobre dados
públicos de Blumenau), telemetria simulada de chuva e nível d'água, e um
motor de risco explicável — toda avaliação de risco vem acompanhada de uma
justificativa textual e de uma ação recomendada, não apenas um número. O
sistema é **software-only e hardware-agnóstico**: não há sensor físico,
rádio LoRa, Meshtastic ou MQTT reais em operação em nenhum momento; toda
telemetria e toda comunicação de campo são simuladas e identificadas como
tal em cada resposta da API e em cada tela. Backend em FastAPI (62 testes
automatizados passando, sem depender de banco), frontend em React 19 + Vite
+ Tailwind + Leaflet, banco espacial PostgreSQL/PostGIS com schema pronto
(ainda não validado ponta a ponta em ambiente local por indisponibilidade
de Docker/sudo). O projeto é fruto de consolidação de trabalho de equipe —
Pedro Zanette, João Benvenutti e Nyrx Oliveira — reunindo peças técnicas
desenvolvidas em fases anteriores do curso.

## 1. Introdução

### 1.1 Contextualização

Eventos de alagamento e inundação urbana são recorrentes em municípios do
Vale do Itajaí, com Blumenau/SC como um dos casos de maior relevância
histórica. A resposta a esses eventos depende de decisões rápidas por parte
da Defesa Civil municipal — priorizar áreas, mobilizar recursos, orientar a
população — tomadas hoje com dados fragmentados entre diferentes fontes e
formatos.

### 1.2 Problema

Informações relevantes para decisão em um evento de inundação — mapa de
suscetibilidade do terreno, chuva acumulada, nível de rio — normalmente
existem em ferramentas separadas, sem cruzamento automático. Isso exige que
o operador combine mentalmente fontes distintas sob pressão de tempo,
aumentando o risco de decisão tardia ou mal informada.

### 1.3 Justificativa

Um painel único que já cruza suscetibilidade topográfica (HAND), dados
dinâmicos (chuva, nível d'água) e produz um score de risco explicado em
linguagem natural reduz a carga cognitiva do operador e padroniza a
priorização. FloodGuard demonstra essa integração como PoC, usando dados
geoespaciais reais de Blumenau/SC processados em fase anterior do projeto,
sem depender de hardware ainda inexistente.

### 1.4 Objetivo do documento

Consolidar, num único documento, escopo, arquitetura, requisitos,
validação, plano de gerenciamento e limitações da PoC FloodGuard, para uso
como material de avaliação acadêmica (SENAI) e como referência técnica de
apresentação do projeto.

### 1.5 Público-alvo

Professores e avaliadores do projeto acadêmico; equipe de desenvolvimento
(para consulta futura); qualquer leitor técnico que precise entender o
estado real do sistema sem precisar ler o código-fonte inteiro.

## 2. Informações do Produto

### 2.1 Visão geral do FloodGuard

Plataforma web composta por um backend FastAPI (motor de risco, dados
geoespaciais, telemetria simulada, alertas e abrigos simulados) e um
frontend React (painel operacional, mapa, telemetria, alertas, abrigos,
página institucional). Piloto único: Blumenau/SC.

### 2.2 Proposta de valor

Reduzir o tempo entre "dado disponível" e "decisão tomada" pela Defesa
Civil, entregando um único painel que já cruza suscetibilidade HAND, chuva
e nível d'água em um score de risco explicado — em vez de depender de
consulta manual a fontes separadas.

### 2.3 Usuários e stakeholders

| Perfil | Papel |
|---|---|
| Operador/coordenador da Defesa Civil | Usuário primário — consome painel, mapa, alertas |
| Prefeitura municipal | Contratante em cenário B2G real (fora do escopo técnico da PoC) |
| Cidadão em área de risco | Não é usuário direto desta PoC — visão de cidadão é roadmap |
| Equipe acadêmica (Pedro Zanette, João Benvenutti, Nyrx Oliveira) | Autoria coletiva do consolidado |
| Avaliadores/professores SENAI | Público desta documentação e da demonstração |

### 2.4 Escopo da PoC

- Motor de risco explicável (HAND + chuva + nível d'água + tendência).
- Pipeline geoespacial HAND real de Blumenau/SC (limite municipal, bacias
  contribuintes, 4 zonas de suscetibilidade).
- Banco espacial PostgreSQL/PostGIS com schema completo.
- Telemetria simulada, com normalização de payload e payload UniMesh/LoRa
  simulado (`implemented: false` sempre).
- Alertas simulados derivados do motor de risco (sem persistência).
- Abrigos simulados para demonstração (sem persistência, sem vínculo com
  instituição real confirmada).
- Dashboard web completo: painel, mapa (com fallback geoespacial estático),
  telemetria, alertas, detalhe de alerta, abrigos, página sobre, 404
  amigável.
- 62 testes automatizados de backend.

### 2.5 Fora do escopo da PoC

- Hardware real (sensores, gateways LoRaWAN, dispositivos Meshtastic).
- Transmissão de rádio ou MQTT reais.
- Persistência real de alertas e abrigos em banco (schema existe, não é
  gravado).
- Autenticação e autorização.
- Emissão oficial de alerta pela Defesa Civil real.
- Vínculo confirmado entre abrigos simulados e instituição real específica.
- Cadastro de abrigo pelo cidadão, chat, app mobile do cidadão.
- Nowcasting de chuva (U-RNN) — citado como entrada futura opcional, não
  implementado.
- Deploy em ambiente de produção.

### 2.6 Benefícios esperados

Demonstração acadêmica de integração ponta a ponta entre geoprocessamento,
motor de decisão explicável e interface operacional; base técnica
reaproveitável para evolução em fases futuras (persistência real,
integração meteorológica, nowcasting); material de portfólio para a equipe.

## 3. Arquitetura da Solução

### 3.1 Visão geral da arquitetura

```
Dados HAND (repositório externo `HAND`, processados por Pedro Zanette)
        ↓ artefatos leves copiados
data/hand/*.gpkg, *.json, previews/*.png
        ↓ services/geo/scripts/{export_to_postgis.py, generate_web_geojson.py}
   ┌────┴─────────────────────────────┐
   ↓                                   ↓
PostgreSQL + PostGIS              apps/web/public/geo/*.geojson
(schema pronto, população          (fallback estático, sempre disponível)
 local não validada e2e)
   ↓
API FastAPI (services/api/app/) — routers: health, geo, risk, telemetry,
scenarios, alerts, shelters
   ↓
Motor de risco (services/api/app/engine/) — roda sem depender do banco
   ↓
Frontend React (apps/web/) — /painel /mapa /alertas /alertas/:id
/telemetria /abrigos /sobre, catch-all 404
```

### 3.2 Backend FastAPI

`services/api/app/main.py` cria a aplicação, habilita CORS e inclui 7
routers, todos sob prefixo `/api/...` (exceto `/health`). Dependências de
produção enxutas (`requirements.txt`): FastAPI, Uvicorn, Pydantic,
SQLAlchemy, psycopg — sem geopandas/rasterio na API (essas ficam isoladas
em `services/geo/`, ambiente Python separado).

### 3.3 Frontend React/Vite

React 19 + Vite 8 + TypeScript + Tailwind 3 + `react-router-dom` 7 +
Leaflet/`react-leaflet` para o mapa. Paleta e componentes centralizados
(`apps/web/src/lib/riskTheme.ts`, componentes `PageHeader`, `SectionCard`,
`MetricCard`, `DemoNotice`, `EmptyState`, `ErrorState`, `RiskLegend`,
`MapLegend`) — nenhuma cor de risco redefinida solta em cada tela.

### 3.4 Motor de risco

`services/api/app/engine/risk_engine.py` combina 4 fatores numa fórmula
única, documentada em `docs/motor-de-risco.md`:

```
score = 0.45·hand_risk_weight + 0.30·rainfall_factor + 0.20·water_level_factor + 0.05·trend_factor
```

Classificação em 4 níveis (`seguro` 0,00–0,25; `atencao` 0,26–0,50;
`alerta` 0,51–0,75; `critico` 0,76–1,00). Sem contexto HAND disponível, o
motor não inventa peso: redistribui os pesos restantes, reduz `confidence`
de 0,95 para 0,55, e sinaliza isso explicitamente na justificativa textual.

### 3.5 HAND e geoprocessamento

Pipeline de cálculo do HAND roda fora deste repositório (repositório
externo `HAND`). O FloodGuard consome os artefatos já publicados: raster de
4 classes de suscetibilidade (0–3), vetorizado uma única vez
(`blumenau_hand_classes_vector.gpkg`, ~19 MB) e exportado tanto para PostGIS
quanto para GeoJSON simplificado (fallback do mapa). Percentuais de área
por classe (17,1% / 9,92% / 20,49% / 52,49%) validados cruzando duas fontes
independentes — detalhes completos em `docs/hand-processamento-detalhado.md`.

### 3.6 Telemetria simulada

`services/api/app/engine/telemetry_normalizer.py` normaliza payload bruto
simulado (aceita aliases de campo em português e inglês), com campos
enriquecidos opcionais (janelas de chuva 15min/1h/6h/24h, tendência
legível, bateria, qualidade de sinal/leitura) adicionados na F6.1 —
`source: "simulation"` e `hardware_implemented: false` são fixos no código,
nunca sobrescritos por payload externo (testado). Detalhes em
`docs/telemetria-detalhada.md`.

### 3.7 Alertas simulados

`GET /api/alerts/demo` e `GET /api/alerts/demo/{id}` recalculam, a cada
chamada, os 3 cenários fixos do motor de risco (`scenarios.DEMO_SCENARIOS`)
— sem persistência. `status` sempre prefixado `simulated_` (nunca "active"
sozinho), para nunca parecer emissão real da Defesa Civil.

### 3.8 Abrigos simulados

`GET /api/shelters/demo` retorna 4 abrigos com nomes genéricos ("Abrigo
Municipal Simulado — Centro" etc.), sem vínculo confirmado com instituição
real, cobrindo os 4 perfis de ocupação pedidos (baixa, média, quase
lotado, indisponível/manutenção). Lista fixa em memória, sem persistência.

### 3.9 Mapa operacional

`RiskMap.tsx` renderiza limite municipal, 4 zonas HAND coloridas e
marcadores de cenários/abrigos via Leaflet. Fonte da geometria decidida em
runtime: PostGIS real quando `GET /api/geo/demo-map` reporta
`source: "postgis"`, fallback estático (`apps/web/public/geo/*.geojson`)
em qualquer outro caso — o mapa nunca fica vazio por falha de banco.
Detalhes em `docs/mapa-diferencial-plano.md`.

### 3.10 Banco PostgreSQL/PostGIS

Schema completo em `db/migrations/` (extensões PostGIS/pgcrypto, tabelas
core, camadas geoespaciais com índice GIST). Não validado ponta a ponta
neste ambiente de desenvolvimento por falta de acesso a Docker/sudo — a
sintaxe SQL foi validada contra um Postgres local descartável, sem a
extensão PostGIS. Nenhum endpoint depende obrigatoriamente do banco para
responder (todos têm caminho de fallback ou não usam banco).

### 3.11 Fallback estático do mapa

`services/geo/scripts/generate_web_geojson.py` gera, a partir dos artefatos
HAND em `data/hand/`, arquivos GeoJSON leves servidos como estático pelo
Vite (`apps/web/public/geo/`). O maior arquivo (`blumenau_hand_zones_simplified.geojson`)
tem ~6,4 MB, simplificado de ~48 MB brutos — bem abaixo do limite de 50 MB.
`GET /api/geo/demo-map` decide a fonte e nunca retorna 500; endpoints
PostGIS reais retornam 503 controlado (não 500 cru) quando o banco está
fora do ar, sem vazar credencial na mensagem.

## 4. Requisitos

### 4.1 Requisitos funcionais

| ID | Requisito | Status |
|---|---|---|
| RF01 | Painel operacional da Defesa Civil (`/painel`) | Implementado |
| RF02 | Mapa de risco com camadas HAND (`/mapa`) | Implementado |
| RF03 | Avaliação de risco por telemetria informada manualmente (`/telemetria`, `POST /api/risk/evaluate`) | Implementado |
| RF04 | Geração de score e nível de risco (4 níveis) | Implementado |
| RF05 | Explicação textual do risco (justificativa gerada pelo motor) | Implementado |
| RF06 | Alertas simulados derivados do motor de risco (`/alertas`, `GET /api/alerts/demo`) | Implementado (simulado) |
| RF07 | Detalhe de alerta individual (`/alertas/:id`, `GET /api/alerts/demo/{id}`) | Implementado (simulado) |
| RF08 | Abrigos simulados com ocupação (`/abrigos`, `GET /api/shelters/demo`) | Implementado (simulado) |
| RF09 | Fallback geoespacial funcional sem PostGIS | Implementado |
| RF10 | Página institucional/sobre (`/sobre`) | Implementado |
| RF11 | Tratamento de rota inexistente (404 amigável) | Implementado |
| RF12 | Documentação técnica do projeto | Implementado (este documento e os demais em `docs/`) |

### 4.2 Requisitos não funcionais

| ID | Requisito | Status |
|---|---|---|
| RNF01 | Software-only (nenhuma dependência de hardware para funcionar) | Atendido |
| RNF02 | Hardware-agnóstico (não fabrica nem exige dispositivo específico) | Atendido |
| RNF03 | API REST (FastAPI, OpenAPI/Swagger automático em `/docs`) | Atendido |
| RNF04 | Interface responsiva (Tailwind, layout adaptável) | Atendido — não testado formalmente em todos os breakpoints |
| RNF05 | Clareza visual (paleta e componentes consistentes) | Atendido |
| RNF06 | Rastreabilidade (toda decisão técnica documentada em `docs/`) | Atendido |
| RNF07 | Transparência sobre simulação (`source`, `simulated`, avisos em tela) | Atendido |
| RNF08 | Segurança e LGPD como preocupação futura | Não implementado — documentado como pendência |
| RNF09 | Versionamento Git (GitHub, organização Nelumbo-Hydroguard) | Atendido |
| RNF10 | Testabilidade (62 testes automatizados de backend) | Atendido no backend; sem suíte de testes de frontend ainda |
| RNF11 | Baixo acoplamento com PostGIS local (endpoints funcionam sem banco) | Atendido |
| RNF12 | Documentação (README + `docs/`) | Atendido |

### 4.3 Restrições

- Sem hardware real.
- Sem sensores reais.
- Sem transmissão LoRa/MQTT real.
- Sem alerta oficial real emitido pela Defesa Civil.
- Sem abrigo real validado/confirmado.
- Piloto único: Blumenau/SC.
- PostGIS local ainda pode estar indisponível neste ambiente de
  desenvolvimento (Docker/sudo não acessíveis).
- Todos os dados de telemetria são simulados.
- Motor de risco não calibrado operacionalmente (pesos e referências são
  valores demonstrativos de PoC).

### 4.4 Priorização

| Item | Prioridade |
|---|---|
| Motor de risco explicável | Alta |
| Painel operacional | Alta |
| Mapa com fallback funcional | Alta |
| Alertas e abrigos simulados | Alta |
| Documentação técnica e de apresentação | Alta |
| Telemetria enriquecida (múltiplas janelas de chuva) | Média |
| Persistência real de alertas/abrigos | Média |
| Autenticação | Média |
| Validação PostGIS ponta a ponta local | Média |
| Integração meteorológica real | Baixa |
| Nowcasting U-RNN | Baixa |
| Deploy em produção | Baixa |

## 5. Dados e Processamento

### 5.1 Dados de entrada

Latitude/longitude, chuva acumulada (mm), nível d'água (m), nível d'água
anterior (para tendência), classe/peso HAND ou região, status de
comunicação — informados manualmente via `/telemetria` ou fixos nos 3
cenários de demonstração.

### 5.2 Dados simulados

Toda leitura de telemetria, os 3 cenários de demonstração, os alertas
derivados deles, os 4 abrigos, e o payload UniMesh/LoRa (`implemented:
false` sempre) são simulados — nenhum vem de sensor físico.

### 5.3 Dados geoespaciais HAND

Limite municipal de Blumenau (IBGE), bacias contribuintes (ANA/SNIRH), e 4
zonas de suscetibilidade HAND vetorizadas — dados reais, processados uma
vez no repositório externo `HAND` e importados como artefatos leves
(`data/hand/`). Ver seção 3.5 e `docs/hand-processamento-detalhado.md`.

### 5.4 Processamento do risco

Entrada normalizada → resolução de contexto espacial (payload explícito ou
lookup mockado por região) → cálculo dos 4 fatores → soma ponderada →
classificação em nível → geração de explicação textual e ação recomendada.
Sem contexto HAND, ativa fallback com confiança reduzida. Ver seção 3.4.

### 5.5 Saídas do sistema

Score de risco (0–1 e percentual), nível (seguro/atenção/alerta/crítico),
confiança, fatores individuais, explicação textual, ação recomendada,
payload UniMesh/LoRa simulado, listas de alertas e abrigos simulados,
camadas geoespaciais (GeoJSON, via PostGIS ou fallback estático).

## 6. Validação

### 6.1 Testes automatizados

**62 de 62 testes de backend passando** (`services/api/tests/`, `pytest`),
cobrindo: motor de risco (score sempre entre 0 e 1, classificação correta
em cada nível, fallback sem HAND, explicação varia com os fatores),
normalizador de telemetria (aliases, clamp, campos enriquecidos),
payload mesh (`implemented: false` sempre, inclusive em risco crítico),
endpoints de geo (nunca 500, nunca vaza credencial, 503 controlado sem
PostGIS), alertas e abrigos simulados (fonte `simulation`, 404 controlado
para id inexistente, ocupação coerente com capacidade). Nenhum teste exige
PostgreSQL para rodar.

### 6.2 Build frontend

`npm run build` (TypeScript + Vite) validado limpo, sem erro de tipo nem de
bundle, nas fases F4, F6 e F7.

### 6.3 Validação da demo

Backend e frontend validados rodando localmente lado a lado (`uvicorn` +
`vite dev`), com verificação HTTP de todas as rotas do frontend e todos os
endpoints citados nesta seção, incluindo o caminho de fallback estático do
mapa (confirmado ativo neste ambiente, já que o PostGIS local não está
disponível).

### 6.4 Limitações da validação

Não há suíte de testes automatizados de frontend (Vitest/Testing Library)
configurada — `npm run build` valida compilação e tipos, não comportamento
em runtime. Validação visual real (screenshot/interação de browser) não foi
possível em várias sessões desta fase por falta de ferramenta de automação
de browser disponível no ambiente — a validação nesses casos foi feita por
requisição HTTP direta e revisão de código-fonte, não por captura visual.
O caminho `source: "postgis"` do mapa e dos endpoints geo nunca foi
exercitado com sucesso neste ambiente (só o caminho de fallback).

## 7. Plano de Gerenciamento

### 7.1 Responsabilidades da equipe

Equipe: **Pedro Zanette**, **João Benvenutti**, **Nyrx Oliveira** — acordo
de consolidação registrado em `docs/autoria-licenca.md`. Componentes de
origem confirmada por repositório: pipeline geoespacial HAND e
consolidação do monorepo FloodGuard (Pedro Zanette); motor de risco e
frontend do `techguard-sentinela`, autorizado para reaproveitamento sob
acordo de equipe (João Benvenutti); participação no acordo de consolidação
(Nyrx Oliveira). Divisão de responsabilidades específica por entrega dentro
das fases F0–F8 não está documentada em nenhum artefato deste repositório
— **a definir pela equipe**, não inventada aqui.

### 7.2 Riscos do projeto

| Risco | Impacto | Mitigação |
|---|---|---|
| PostGIS local indisponível | Médio | Fallback estático sempre funcional; endpoints retornam 503 controlado, nunca 500 |
| Interpretação errada de dado simulado como real | Alto | `source`/`simulated` em toda resposta da API; aviso `[DEMO]` em toda tela |
| Motor de risco não calibrado | Médio | Documentado em `docs/limitacoes.md`; não recomendado para decisão real |
| Escopo crescer demais | Médio | Fases numeradas com objetivo único (F0–F8); roadmap separado do MVP |
| Ausência de autenticação | Médio | Fora do escopo da PoC; pendência registrada para produção |
| LGPD (dado pessoal futuro) | Médio | Não implementado; necessidade de política de acesso já sinalizada |
| Dependência de mapa-base externo (OpenStreetMap) | Baixo | Camadas de dado (HAND, marcadores) não dependem da rede externa |
| Confusão entre bacia contribuinte e limite municipal | Médio | Explicado na própria tela `/mapa` — comportamento intencional, não bug |

Detalhamento de cada mitigação, quando o texto da tabela não é suficiente:
PostGIS indisponível tem caminho de validação futura descrito em
`docs/roadmap.md`; a confusão entre bacia contribuinte e limite municipal é
aprofundada em `docs/mapa-diferencial-plano.md`; a pendência de LGPD é
detalhada em `docs/relatorio-geral-floodguard.md`.

### 7.3 Cronograma macro

| Fase | Entrega |
|---|---|
| F0 | Documentação inicial e decisões de arquitetura |
| F1 | Estrutura do monorepo (backend, frontend, banco, infra) |
| F2 | Artefatos HAND reais de Blumenau importados |
| F3 | Motor de risco explicável, testado |
| F4 | Dashboard conectado à API real |
| F5 | Documentação técnica (relatório geral, árvore de arquivos) |
| F6 | Estabilização visual e mapa funcional com fallback |
| F7 | Alertas e abrigos simulados via API |
| F8 | Documentação final e preparação de apresentação (este documento) |
| F9 | Deploy e empacotamento de demo — futuro, não iniciado |

## 8. Limitações e Trabalhos Futuros

### Limitações atuais

- PostGIS não validado ponta a ponta neste ambiente local.
- Motor de risco com pesos demonstrativos, não calibrados com dado
  histórico real.
- Sem persistência de alertas e abrigos — tudo recalculado ou fixo em
  memória a cada chamada.
- Sem autenticação/autorização em nenhum endpoint.
- Resolução do DEM (~30 m) não captura microtopografia urbana.
- Sem suíte de testes de frontend.
- Zonas HAND extrapolam o limite municipal intencionalmente (área
  hidrologicamente contribuinte) — pode confundir leitor não avisado.

### Roadmap técnico

- Validar `export_to_postgis.py export-all` contra PostGIS real.
- Motor de risco completo (NDVI/NDBI/Tc) do `techguard-sentinela` como
  alternativa mais sofisticada.
- Nowcasting com U-RNN como entrada opcional no fator de chuva.
- Persistir telemetria, alertas e abrigos no PostGIS.
- Suíte de testes de frontend (Vitest).

### Roadmap operacional

- Autenticação e perfis de operador.
- Cadastro real de abrigo, com triagem de solicitações do cidadão.
- App/visão mínima do cidadão (consulta de alertas e abrigos).
- Expansão para múltiplos municípios.
- Integração meteorológica real.
- Deploy em ambiente acessível publicamente.

## 9. Conclusão

FloodGuard demonstra, de ponta a ponta, a integração entre dado geoespacial
real (HAND de Blumenau/SC), um motor de decisão explicável e uma interface
operacional voltada à Defesa Civil municipal — mantendo, em cada camada,
transparência explícita sobre o que é real e o que é simulado. A PoC
cumpre o objetivo acadêmico de mostrar viabilidade técnica da arquitetura
proposta, com 62 testes automatizados de backend passando e frontend
buildando sem erro, ao mesmo tempo em que documenta com honestidade suas
limitações — motor não calibrado, ausência de persistência real,
dependência ainda não validada do PostGIS — como itens de roadmap
explícito, não como lacunas escondidas.

## 10. Referências internas

- [README.md](../README.md)
- [docs/metodologia-hand.md](metodologia-hand.md)
- [docs/hand-processamento-detalhado.md](hand-processamento-detalhado.md)
- [docs/motor-de-risco.md](motor-de-risco.md)
- [docs/telemetria-detalhada.md](telemetria-detalhada.md)
- [docs/mapa-diferencial-plano.md](mapa-diferencial-plano.md)
- [docs/limitacoes.md](limitacoes.md)
- [docs/roadmap.md](roadmap.md)
- [docs/decisoes-arquitetura.md](decisoes-arquitetura.md)
- [docs/autoria-licenca.md](autoria-licenca.md)
- [docs/relatorio-geral-floodguard.md](relatorio-geral-floodguard.md)
- [docs/arvore-arquivos-floodguard-detalhada.md](arvore-arquivos-floodguard-detalhada.md)
