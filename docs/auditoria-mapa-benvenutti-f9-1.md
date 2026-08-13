# Auditoria F9.1 — Mapa e Alertas no Mapa

## 1. Objetivo

Avaliar a solução visual de mapa/alertas do projeto **TechGuard Sentinela**
(João Benvenutti) como referência externa, decidir o que vale a pena
adaptar para o FloodGuard sem copiar código nem aumentar escopo/risco, e
implementar uma melhoria pequena e estável: alertas simulados visíveis e
clicáveis no mapa, com navegação cruzada entre `/alertas`, `/alertas/:id` e
`/mapa`.

Esta rodada parte da `main` do FloodGuard (`38f48b4`), que já contém a F9.0
squash-merged (verificado por `git diff` vazio entre `origin/main` e
`origin/audit/f9-quality-excellence-pass` antes de iniciar). Trabalho feito
em `audit/f9-1-map-alert-ux-review`.

## 2. Projeto de referência analisado

- **Caminho:** `../techguard-sentinela` (pasta irmã do FloodGuard, dentro do
  workspace `Tech Guard`), autoria de João Benvenutti.
- **Arquivos de mapa/alerta lidos** (só leitura, nada foi alterado):
  - `frontend/src/App.tsx`
  - `frontend/src/components/InteractiveMap.tsx`
  - `frontend/src/components/ActivePublicAlerts.tsx`
  - `frontend/src/components/AlertTimeline.tsx`
  - `frontend/src/components/CrisisTriageModal.tsx`
  - `frontend/src/components/CommandHeader.tsx`
  - `frontend/src/components/RiskGauge.tsx`
  - `frontend/src/components/SensorDetail.tsx`
  - `frontend/src/components/TerritorialPanel.tsx` (vazio, não usado)
  - `frontend/src/hooks/useSentinela.ts`
  - `frontend/src/types.ts`
  - `frontend/src/index.css` (trechos relevantes)
  - `frontend/package.json`
  - `backend/main.py`, `backend/engine/crisis_manager.py` (trechos relevantes)
  - `README.md` (trechos relevantes)
- **Observação:** o projeto foi usado **apenas como referência de leitura**.
  Nenhum arquivo dentro de `techguard-sentinela/` foi modificado, e nada foi
  commitado ali.

## 3. Comparação Benvenutti x FloodGuard

| Aspecto | Benvenutti (TechGuard Sentinela) | FloodGuard (antes da F9.1) | Decisão | Justificativa |
|---|---|---|---|---|
| Biblioteca de mapa | react-leaflet v5 + leaflet v1.9.4, tile CARTO dark | react-leaflet v5 + leaflet v1.9.4, tile OpenStreetMap | Manter FloodGuard | Mesma stack já validada; trocar tile por estética não vale o risco/escopo. |
| Marcadores de alerta/risco | Sensores são quadrados azuis fixos (não mudam de cor por severidade); severidade aparece só na máscara de inundação e na UI fora do mapa | Pontos de cenário coloridos por `risk_level`, popup simples (nome, score, explicação) | **Melhorar**: manter marcador colorido por nível (já era melhor que o Benvenutti aqui) e enriquecer o popup com dados de alerta completos | FloodGuard já cifrava severidade no próprio marcador — ponto forte a preservar, não a descartar. |
| Clique no marcador | Painel lateral fixo (`SensorDetail`), não é popup do Leaflet | `Popup` do Leaflet simples | **Adaptar como Popup mais rico**, não copiar o painel lateral | Painel lateral fixo é mudança de layout maior (risco de quebrar responsividade/HUD); Popup do Leaflet já é o padrão usado em todas as outras camadas do FloodGuard (zonas HAND, abrigos) — manter consistência. |
| Destaque de alerta crítico | Anel pulsante (`pulseGlow`/`alert-critical-pulse`, CSS puro) + overlay de tela inteira piscando (`flashAlarm`) quando há crítico | Nenhum destaque visual de criticidade no mapa | **Adaptar parcialmente**: anel pulsante (`animate-ping`, Tailwind, zero dependência nova) só no marcador crítico | O anel pulsante é pequeno, contido e já usa utilitário Tailwind existente no projeto. O overlay de tela inteira é intrusivo demais para uma PoC acadêmica e fora do pedido ("pequeno e estável"). |
| Camada de risco HAND no mapa | **Não implementada** — endpoint existe no backend, mas o frontend nunca busca nem renderiza (`hand_zones` não referenciado em `frontend/src`) | Implementada e funcional (zonas coloridas por suscetibilidade, com fallback estático) | Manter FloodGuard | FloodGuard já está à frente do Benvenutti neste ponto — nada a trazer. |
| Tempo real | WebSocket nativo (`ws://localhost:8000/ws`) + bridge MQTT para broker público (`test.mosquitto.org`, sem autenticação) | Nenhum tempo real; tudo via `fetch` sob demanda | **Não trazer** | Fora de escopo explícito da F9.1 (proibido WebSocket/MQTT novos); broker público sem auth também é risco de segurança que o FloodGuard não deveria herdar. |
| Dados simulados | Sim, mas com um endpoint (`/api/audit/coordinate`) que **fabrica** HAND/NDVI/NDBI via fórmula pseudo-aleatória (`sin(lat*1000)*cos(lng*1000)`) rotulado como "🛰️ Sentinel-1/2 (GEE)" | Todos os dados simulados são claros sobre a origem (`source: "simulation"`, prefixo `simulated_` no status, `DemoNotice` em toda tela) | **Não trazer o padrão do Benvenutti** | Rotular dado fabricado como se fosse leitura de satélite real contradiz a identidade de honestidade do FloodGuard (PoC transparente); é exatamente o tipo de coisa que a auditoria F6.2/F9 já vinha corrigindo no próprio FloodGuard. |
| Triagem humana / dispatch de alerta | `CrisisTriageModal` completo — fila de triagem, decisão de ação, disparo multicanal simulado, persistência em memória (não em banco) | Não existe (alerta é só leitura/consulta) | **Não trazer agora** | Aumenta escopo fortemente (workflow de estado, fila, "aprovação"), soa perto demais de "alerta oficial" sendo despachado por um operador — risco de descaracterizar a PoC como apoio à decisão e não sistema operacional. Fica registrado como ideia de roadmap, não como pendência da F9.1. |
| Dependências de mapa/tempo real (frontend) | `leaflet`, `react-leaflet`, `lucide-react` (ícones); zero libs de socket/mqtt no frontend (WebSocket nativo) | `leaflet`, `react-leaflet` já instalados, nenhuma lib de tempo real | Manter | Nenhuma dependência nova necessária para as melhorias da F9.1. |

## 4. Achados

| ID | Severidade | Área | Problema/Oportunidade | Impacto | Ação |
|---|---|---|---|---|---|
| F9.1-01 | Média | `RiskMap.tsx` | Alertas simulados (`/api/alerts/demo`) nunca apareciam no mapa — só os 3 pontos de cenário "crus" (nome + score + explicação), sem os campos operacionais que `/alertas` já mostra (ação recomendada, confiança, status, aviso de simulação). | Mapa não comunicava a mesma riqueza de informação que a tela de Alertas — avaliador via dois artefatos desconectados para o mesmo dado. | Substituir os marcadores de "ponto de cenário" por marcadores de "alerta simulado", com popup completo. |
| F9.1-02 | Baixa | `services/api/app/schemas/alerts.py` | `DemoAlert` não expunha `latitude`/`longitude` — para desenhar no mapa seria preciso correlacionar por `id` com `/api/geo/demo-points` num segundo fetch. | Acoplamento desnecessário entre dois endpoints; frágil se os ids algum dia divergirem. | Adicionar `latitude`/`longitude` ao `DemoAlert`, populados da mesma fonte (`DEMO_SCENARIOS`) já usada por `/api/geo/demo-points` — sem inventar geografia nova. |
| F9.1-03 | Baixa | `AlertDetail.tsx`, `Alertas.tsx` | Link "Ver no Mapa" existia só em `AlertDetail.tsx`, sem apontar para o alerta específico (ia para `/mapa` genérico); `Alertas.tsx` não tinha link para o mapa nenhum. | Navegação mapa↔alerta era unidirecional e não focava o alerta certo. | Adicionar `?alert=<id>` ao link existente e criar "Ver no mapa →" em cada card de `Alertas.tsx`. |
| F9.1-04 | Baixa | `MapLegend.tsx` | Legenda descrevia os marcadores como "Cenários simulados", nome que não bate com a terminologia de `/alertas` ("alerta"). | Pequena inconsistência de vocabulário entre telas. | Atualizar rótulo para "Alertas simulados" e adicionar entrada explicando o destaque pulsante do nível crítico. |
| F9.1-05 | Informativa | Geral | Nenhum destaque visual diferenciava um alerta crítico dos demais no mapa. | Numa demo, o avaliador precisa abrir o popup de cada marcador para saber qual é o crítico. | Anel pulsante (`animate-ping`) só no marcador de nível `critico`, inspirado no padrão do Benvenutti, reimplementado com Tailwind já disponível. |

## 5. Melhorias aplicadas no FloodGuard

**Backend**
- `services/api/app/schemas/alerts.py` — `DemoAlert` ganhou `latitude: float` e
  `longitude: float`.
- `services/api/app/routers/alerts.py` — `_build_alert()` popula as novas
  colunas a partir do mesmo `DEMO_SCENARIOS[alert_id]` já usado por
  `/api/geo/demo-points` (nenhuma geografia nova inventada).
- `services/api/tests/test_alerts_demo.py` — dois testes novos:
  `test_demo_alerts_have_valid_coordinates_for_map_rendering` e
  `test_demo_alert_coordinates_match_demo_scenario_source`.

**Frontend**
- `apps/web/src/lib/api.ts` — `DemoAlert` (interface TS) ganhou
  `latitude`/`longitude`.
- `apps/web/src/components/AlertMapPopup.tsx` (novo) — card de popup com
  título, badge de nível, região, status, score, confiança, explicação, ação
  recomendada, aviso `[simulado]` e links para `/alertas/:id` e (quando
  aplicável) `/telemetria`.
- `apps/web/src/pages/RiskMap.tsx`:
  - troca a busca de `fetchDemoPoints()` por `fetchDemoAlerts()` — os
    marcadores de cenário agora são marcadores de alerta (mesma
    localização, dado mais completo, uma fonte de verdade a menos para
    manter sincronizada).
  - `alertIcon()` — ícone colorido por `risk_level`, com anel pulsante
    (`animate-ping`) exclusivo para `critico`.
  - `MapAlertFocus` — componente interno que lê `?alert=<id>` da URL
    (`useSearchParams`), dá `flyTo` até o marcador e abre o popup
    automaticamente.
  - `DemoNotice` do mapa atualizado para descrever os marcadores como
    "eventos simulados de demonstração" com link para `/alertas`.
- `apps/web/src/components/MapLegend.tsx` — entrada "Alertas simulados"
  substitui "Cenários simulados"; nova entrada para o destaque pulsante do
  nível crítico.
- `apps/web/src/pages/Alertas.tsx` — cada card ganhou link "Ver no mapa →"
  (`/mapa?alert=<id>`).
- `apps/web/src/pages/AlertDetail.tsx` — link "Ver no Mapa" agora aponta
  para `/mapa?alert=<id>` em vez de `/mapa` genérico.

## 6. Como o mapa ficou após F9.1

- **Alertas simulados no mapa:** os 3 alertas de `/api/alerts/demo`
  (seguro/alerta/crítico) aparecem como marcadores coloridos nas mesmas
  coordenadas já usadas pelo motor de risco (`DEMO_SCENARIOS`).
- **Popup:** clicar num marcador abre um `Popup` do Leaflet com título,
  região, status, score, confiança, explicação, ação recomendada, aviso de
  simulação e links para o detalhe (`/alertas/:id`) e, quando o alerta
  sugere, para `/telemetria`.
- **Integração com `/alertas`:** cada card da lista tem "Ver no mapa →".
- **Integração com `/alertas/:id`:** o link "Ver no Mapa" agora carrega o
  alerta específico.
- **Query param:** `/mapa?alert=critico` dá `flyTo` até o marcador e abre o
  popup automaticamente — implementado com `useSearchParams` +
  `useMap()`/`flyTo` do react-leaflet, sem rota nova nem estado global.
- **Fallback estático:** preservado sem alteração — a lógica de
  `fetchDemoMap()` → PostGIS ou GeoJSON estático continua exatamente como
  estava; os alertas são uma camada adicional independente desse fallback
  (não dependem de PostGIS, igual antes com `fetchDemoPoints()`).

## 7. O que não foi trazido do projeto do Benvenutti

- **WebSocket/MQTT em tempo real** — proibido pelo escopo da F9.1 e exigiria
  backend novo, contrato de mensagens novo e broker externo.
- **Sala de Crise / triagem humana (`CrisisTriageModal`)** — workflow grande
  (fila, aprovação, disparo multicanal), fora do escopo de uma correção
  pequena e estável; também se aproxima perigosamente de "alerta oficial
  sendo despachado", o que a identidade do FloodGuard proíbe explicitamente.
- **Painel lateral fixo (`SensorDetail`) no lugar do popup** — mudança de
  layout maior, risco de quebrar responsividade das outras camadas
  (zonas HAND, abrigos) que já usam `Popup`; o padrão popup já é consistente
  no FloodGuard.
- **Endpoint de "auditoria de coordenada" com dado fabricado
  (`/api/audit/coordinate`)** — a fórmula pseudo-aleatória rotulada como
  leitura de satélite real contradiz a exigência de honestidade da PoC.
- **Overlay de tela inteira piscando (`flashAlarm`) para estado crítico** —
  intrusivo demais para uma demo acadêmica; o anel pulsante no marcador já
  cumpre o papel de destaque sem tomar a tela toda.
- **Broker MQTT público sem autenticação** — risco de segurança
  desnecessário para uma PoC, e fora do escopo (nenhum MQTT novo).

## 8. Validação

- **Backend:** `python -m pytest` — **67 passed** (65 da F9.0 + 2 novos
  testes de coordenadas de alerta), 0 falhas.
- **Frontend:** `npm run build` (`tsc -b && vite build`) — build limpo, sem
  erros de tipo.
- **Endpoints verificados via `curl`:**
  - `GET /api/alerts/demo` → 200, com `latitude`/`longitude` em cada alerta.
  - `GET /api/alerts/demo/critico` → 200, com `latitude: -26.898`,
    `longitude: -49.081`.
  - `GET /api/geo/demo-map` → 200.
  - `GET /api/geo/demo-points` → 200.
- **Rotas do frontend verificadas via `curl` (dev server local, porta
  5174 — a 5173 já estava ocupada por outra sessão em execução neste
  workspace):**
  `/mapa`, `/mapa?alert=critico`, `/alertas`, `/alertas/critico`,
  `/abrigos` → todas 200.
- **Limitação da validação visual:** não havia extensão de browser
  headless disponível neste ambiente (`Playwright MCP Bridge` não
  conectada), então **a renderização visual real dos marcadores, o
  pulsar do ícone crítico, a abertura do popup e o `flyTo` do
  `?alert=critico` não foram confirmados visualmente em navegador** —
  apenas por leitura de código, tipos TypeScript compilando e resposta
  HTTP 200 das rotas. Recomenda-se abrir `/mapa` e `/mapa?alert=critico`
  manualmente antes da apresentação (ver seção 9).

## 9. Riscos restantes

1. **Renderização visual não confirmada em navegador** (ver seção 8) — o
   código compila e os dados chegam corretos, mas o comportamento do
   Leaflet (ícone, popup, `flyTo`) não foi visto rodando.
2. **`ref` do `Marker` do react-leaflet** — o `alertMarkerRefs` depende do
   callback `ref` do componente `Marker` devolver a instância `L.Marker`
   corretamente em react-leaflet v5; isso é o comportamento documentado da
   biblioteca, mas não foi exercitado em runtime nesta rodada.
3. **Dependência de rede para o tile do OpenStreetMap** — inalterada desde
   antes da F9.1, já documentada em `docs/mapa-diferencial-plano.md`.

## 10. Recomendação para apresentação

- Antes da banca, rodar `npm run dev` + `uvicorn` e abrir manualmente
  `/mapa`, clicar no marcador crítico, depois abrir `/alertas/critico` e
  clicar "Ver no Mapa" para confirmar o `flyTo` + popup automático.
- Usar a frase: "O mesmo alerta simulado que você vê em `/alertas` aparece
  no mapa, na localização real do cenário — não é um dado inventado à
  parte para a demonstração do mapa."
- Se o marcador crítico pulsante não for visualmente óbvio na tela do
  projetor, mencionar verbalmente que ele pulsa — não é uma falha, é uma
  pista de apresentação.

## 11. Conclusão

O projeto do Benvenutti tem pontos fortes reais (painel lateral rico,
pulso visual de criticidade, estética de "centro de comando"), mas boa
parte do que o diferencia depende de infraestrutura (WebSocket, MQTT,
triagem com estado) fora do escopo e da identidade do FloodGuard como PoC
acadêmica software-only. A F9.1 trouxe o que dava para adaptar com baixo
risco — alertas simulados visíveis e clicáveis no mapa, com destaque de
criticidade e navegação cruzada com `/alertas` — sem tocar em
`final_poc/`, `mentorias/`, sem novo WebSocket/MQTT, sem sensor ou alerta
real, e mantendo o fallback estático do mapa intacto. Backend em 67/67
testes, build de frontend limpo, nada commitado.
