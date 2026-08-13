# Auditoria Visual e Funcional da Demo — F6.2

> Auditoria executada em 2026-08-12, sobre a branch `feat/f6-demo-excellence`,
> com backend e frontend rodando de verdade (não é leitura de código). Cada
> tela foi renderizada em browser headless (Google Chrome 151, viewport
> 1440x1000), com captura de DOM, screenshot e console. Endpoints validados
> por `curl` contra a API no ar.
>
> **Nenhum código foi alterado nesta auditoria. Nada foi commitado.**

---

## 1. Ambiente validado

| Item | Valor |
|---|---|
| Diretório | `/home/pedro/Documentos/Faculdade/Outros/Tech Guard/FloodGuard` |
| Branch | `feat/f6-demo-excellence` |
| HEAD | `3c0013b feat(web): connect dashboard to risk engine API` |
| Working tree | 44 arquivos modificados/não rastreados (F6.0/F6.1 ainda não commitados) |
| Python | 3.14.4 (venv em `services/api/.venv`) |
| Node / npm | v20.20.2 / 10.8.2 |
| Browser de auditoria | Google Chrome 151.0.7922.108 (headless) |
| API | `http://localhost:8000` — no ar durante toda a auditoria |
| Frontend | `http://localhost:5173` — Vite dev server no ar |
| PostGIS | **Indisponível** — auditoria exercitou o caminho de fallback |

**Observação de ambiente:** as portas 8000 e 5173 já estavam ocupadas por
uma sessão de desenvolvimento paralela na mesma máquina. A auditoria
reaproveitou esses processos em vez de subir instâncias duplicadas — o
código servido é o mesmo do working tree atual.

---

## 2. Resultado dos testes backend

```
python -m pytest -v
40 passed, 1 warning in 0.48s
```

**Backend: PASSOU.** 40/40 testes, zero falhas, zero erros.

| Suíte | Testes | Resultado |
|---|---|---|
| `test_geo_demo.py` | 6 | ✅ todos passaram |
| `test_mesh_payload.py` | 4 | ✅ todos passaram |
| `test_risk_api.py` | 9 | ✅ todos passaram |
| `test_risk_engine.py` | 10 | ✅ todos passaram |
| `test_telemetry_normalizer.py` | 11 | ✅ todos passaram |

Único warning: `StarletteDeprecationWarning` sobre `httpx`/`httpx2` no
`TestClient` — vem da biblioteca, não do código do projeto. Não afeta a
demo.

---

## 3. Resultado do build frontend

```
npm install   → found 0 vulnerabilities
npm run build → tsc -b && vite build

dist/index.html                   0.39 kB │ gzip:   0.27 kB
dist/assets/index-BhrgU56i.css   27.48 kB │ gzip:   9.68 kB
dist/assets/index-DCi70JZQ.js   416.05 kB │ gzip: 127.54 kB
✓ built in 684ms
```

**Frontend: BUILDOU.** TypeScript compilou sem erro, bundle gerado, 0
vulnerabilidades no `npm install`.

Observação: 416 kB de JS (127 kB gzip) — peso normal para React + Leaflet,
sem problema para demo local.

---

## 4. Endpoints testados

### 4.1 Endpoints que funcionam (HTTP 200)

| Endpoint | Status | Observação |
|---|---|---|
| `GET /health` | ✅ 200 | `{"status":"ok","mode":"simulation"}` |
| `GET /docs` | ✅ 200 | Swagger UI carrega, título "FloodGuard API - Swagger UI" |
| `GET /api/risk/status` | ✅ 200 | Metadado do motor |
| `GET /api/telemetry/status` | ✅ 200 | `source: "simulation"` |
| `GET /api/scenarios/demo` | ✅ 200 | 3 cenários, calculados pelo motor real |
| `GET /api/geo/demo-map` | ✅ 200 | `status: "degraded"`, `source: "static_fallback"` — fallback funcionando |
| `GET /api/geo/demo-points` | ✅ 200 | 3 pontos com lat/lon/nível/explicação |
| `POST /api/risk/evaluate` | ✅ 200 | Retornou `alerta`, score 0.61, confiança 0.95 |
| `POST /api/risk/evaluate-batch` | ✅ 200 | Coberto por teste |
| `POST /api/telemetry/normalize` | ✅ 200 | Campos F6.1 confirmados em runtime |
| `POST /api/telemetry/mesh-payload` | ✅ 200 | `implemented: false`, `compact_payload` correto |

Validação em runtime do enriquecimento da F6.1 (`POST /api/telemetry/normalize`):
enviando `previous_water_level_m: 1.6` + `water_level_m: 1.85`, a API
derivou corretamente `water_level_delta_m: 0.25` e `trend: "subindo"`, e
manteve `hardware_implemented: false` / `source: "simulation"`.

### 4.2 Endpoints que retornam ERRO 500 (dependem de PostGIS)

| Endpoint | Status | Impacto |
|---|---|---|
| `GET /api/geo/hand-zones/summary` | ❌ **500** | Internal Server Error |
| `GET /api/geo/municipality/blumenau` | ❌ **500** | Internal Server Error |
| `GET /api/geo/hand-zones` | ❌ **500** | Internal Server Error |
| `GET /api/geo/basins/blumenau` | ❌ **500** | Internal Server Error |
| `GET /api/geo/point-risk-context?lat&lon` | ❌ **500** | Internal Server Error |

**5 dos 19 endpoints da API retornam 500 neste ambiente.** Não quebram
nenhuma tela (o frontend só usa `demo-map`/`demo-points`, que têm
fallback), mas **quebram a demo do Swagger**: um avaliador que abrir
`/docs` e clicar "Try it out" nesses 5 endpoints vê erro 500 cru.

### 4.3 Inconsistência grave encontrada

`GET /api/geo/status` responde:

```json
{"module":"geo","status":"connected","note":"camadas HAND reais de Blumenau importadas na F2 (services/geo)"}
```

**Isso é falso neste ambiente.** O endpoint retorna `"connected"` de forma
*hardcoded* — não testa conexão nenhuma. O PostGIS está fora do ar (provado
pelos 5 erros 500 acima e pelo `demo-map` retornando `static_fallback`).
Um avaliador que bater nesse endpoint vai concluir que o banco está
conectado e as camadas importadas, quando não estão.

---

## 5. Tela por tela

Todas as 7 telas foram renderizadas em browser real. **Zero erros de
JavaScript no console em todas as 7 telas** (os únicos registros no log do
Chrome são warnings internos de SQLite/GPU do próprio browser headless, não
relacionados à aplicação).

### 5.1 `/` — Landing

| Aspecto | Resultado |
|---|---|
| Abriu? | ✅ Sim |
| Dados que carrega | Nenhum — página 100% estática |
| Chamadas de API | Nenhuma |
| Visualmente bom | Tipografia limpa; disclaimer de PoC presente e honesto |
| Visualmente fraco | **~85% da tela é vazio preto.** Sem logo, sem imagem, sem mapa de fundo, sem identidade visual além do texto |
| Vazio | Sim — 3 linhas de texto centralizadas num viewport de 1440x1000 |
| Placeholder? | Não é placeholder, mas parece inacabado |
| Confunde avaliador? | **Sim, criticamente: não existe NENHUM link ou botão na página.** Confirmado por inspeção do DOM: zero elementos `<a>`. O avaliador que abrir a raiz do produto fica preso — não há como entrar no sistema sem digitar `/painel` na barra de endereço |
| Corrigir antes da apresentação? | **SIM — prioridade máxima** |

### 5.2 `/sobre` — Sobre

| Aspecto | Resultado |
|---|---|
| Abriu? | ✅ Sim |
| Dados que carrega | Nenhum — conteúdo estático |
| Chamadas de API | Nenhuma |
| Visualmente bom | Conteúdo excelente e honesto: explica produto, problema, HAND, motor de risco, e separa "Implementado / Simulado / Roadmap" |
| Visualmente fraco | Container `max-w-3xl` deixa **toda a metade direita da tela vazia** em 1440px. Cards empilhados à esquerda, muito espaço morto à direita |
| Vazio | Metade direita do viewport |
| Placeholder? | Não |
| Confunde avaliador? | **Sim, um ponto:** afirma "27+ testes automatizados" — o número real hoje é **40**. Claim desatualizado subestima o próprio projeto |
| Corrigir antes da apresentação? | Sim — média prioridade (número dos testes + aproveitar largura) |

### 5.3 `/painel` — Dashboard

| Aspecto | Resultado |
|---|---|
| Abriu? | ✅ Sim |
| Dados que carrega | 3 cenários do motor de risco real + status do motor |
| Chamadas de API | `GET /api/risk/status`, `GET /api/scenarios/demo` |
| Visualmente bom | **A melhor tela do produto.** Badge "motor de risco: online" em verde; 4 cards de métrica (3 cenários, Maior risco "Crítico" em vermelho, Confiança média 95%, Comunicação "Simulada"); bloco "Próxima ação recomendada" destacado; legenda de 4 níveis; 3 `RiskCard` completos com score em %, barras de fator (HAND/Chuva/Nível/Tendência), justificativa textual e ação recomendada. Hierarquia visual clara, cores consistentes |
| Visualmente fraco | Nada relevante. Único detalhe: barra "Tendência 50%" no cenário seguro pode confundir (50% = neutro, não "metade do risco") |
| Vazio | Nada |
| Placeholder? | Não |
| Confunde avaliador? | Baixo risco. O aviso `[DEMO]` está no topo e é claro |
| Corrigir antes da apresentação? | Não — **é a tela para abrir a apresentação** |

### 5.4 `/mapa` — Mapa de risco

Ver seção 5.8 abaixo (auditoria dedicada).

### 5.5 `/telemetria` — Telemetria

| Aspecto | Resultado |
|---|---|
| Abriu? | ✅ Sim |
| Dados que carrega | Formulário pré-preenchido com o cenário "alerta" |
| Chamadas de API | Sob demanda: `POST /api/risk/evaluate` (botão "Avaliar risco"), `POST /api/telemetry/mesh-payload` (botão "Gerar payload UniMesh/LoRa simulado") |
| Visualmente bom | Formulário organizado em 2 colunas; 3 botões de exemplo rápido (Seguro/Alerta/Crítico) coloridos coerentemente; aviso `[DEMO]` explícito de que não há sensor real; labels explicativas ("Nível d'água anterior — usado para calcular tendência") |
| Visualmente fraco | Tela abre "fria": só formulário, sem resultado. O terço inferior fica vazio até o avaliador clicar em algo. **Nenhum resultado pré-carregado** |
| Vazio | Área de resultado (até interagir) |
| Placeholder? | Não |
| Confunde avaliador? | Risco médio: **os 12 campos enriquecidos da F6.1 (sensor_id, chuva 15m/1h/6h/24h, bateria, qualidade de sinal) NÃO aparecem no formulário.** Existem na API e estão documentados, mas a tela não os expõe — quem só olhar a UI vai achar que a telemetria continua rasa |
| Corrigir antes da apresentação? | Recomendado — média prioridade |

### 5.6 `/alertas` — Alertas

| Aspecto | Resultado |
|---|---|
| Abriu? | ✅ Sim |
| Dados que carrega | 3 alertas derivados dos cenários do motor |
| Chamadas de API | `GET /api/scenarios/demo` |
| Visualmente bom | Filtros por nível com contagem (`Todos (3)`, `Seguro (1)`, `Atenção (0)`, `Alerta (1)`, `Crítico (1)`); cada card com barra colorida no topo, tag `SIMULADO`, região, timestamp, explicação e ação recomendada; link "Ir para Telemetria" no aviso de demo |
| Visualmente fraco | Metade inferior da tela vazia (só 3 cards); cards não são clicáveis |
| Vazio | Filtro "Atenção (0)" está sempre zerado — **nenhum dos 3 cenários fixos produz o nível `atencao`**, então 1 dos 4 níveis do motor nunca é demonstrado |
| Placeholder? | Não, mas os "alertas" são só uma segunda visualização dos mesmos 3 cenários do painel |
| Confunde avaliador? | **Sim, dois pontos:** (1) o card do meio tem título **"Alerta simulado — atenção"** mas badge **"ALERTA"** laranja — título e badge se contradizem; (2) a rota `/alertas/:id` existe e renderiza um placeholder, mas **nenhum card linka para ela** (confirmado no DOM: zero `href="/alertas/..."`) — funcionalidade morta |
| Corrigir antes da apresentação? | Sim — alta prioridade no título/badge contraditório |

### 5.7 `/abrigos` — Abrigos

| Aspecto | Resultado |
|---|---|
| Abriu? | ✅ Sim |
| Dados que carrega | Nenhum |
| Chamadas de API | Nenhuma |
| Visualmente bom | O texto é honesto ("Dados reais entram quando o router de shelters estiver conectado ao banco") |
| Visualmente fraco | **~90% da tela é preto vazio.** DOM tem 1 único `<p>` de conteúdo |
| Vazio | Praticamente tudo |
| Placeholder? | **Sim, assumidamente** — backend (`shelters.py`) também é placeholder |
| Confunde avaliador? | **Sim:** o item "Abrigos" está no menu principal com o mesmo peso visual de "Painel" e "Mapa". Quem clicar espera funcionalidade e encontra uma página vazia. Passa impressão de produto inacabado |
| Corrigir antes da apresentação? | **SIM — decidir: esconder do menu, marcar como "em breve", ou popular com dados simulados** |

### 5.8 Auditoria dedicada do mapa (`/mapa`)

Item de atenção especial do pedido. Todos os 7 pontos verificados:

| # | Verificação | Resultado |
|---|---|---|
| 1 | Leaflet renderiza? | ✅ **SIM.** `MapContainer` monta, controles `leaflet-control-zoom-in/out` presentes, `leaflet-zoom-animated` ativo, atribuição OpenStreetMap visível |
| 2 | Limite de Blumenau aparece? | ⚠️ **Renderiza, mas quase invisível.** DOM confirma o path com `stroke="#22d3ee"` e `stroke-dasharray="4 3"`. Visualmente some sob o preenchimento das zonas HAND |
| 3 | Zonas HAND aparecem? | ✅ **SIM.** 4 paths SVG, um por classe, com as cores corretas: `#22c55e` (muito baixa), `#eab308` (baixa), `#f97316` (média), `#ef4444` (alta) |
| 4 | Pontos de cenário aparecem? | ✅ **SIM.** 3 marcadores `divIcon` coloridos por nível, visíveis sobre Blumenau |
| 5 | Legenda aparece? | ✅ **SIM.** `MapLegend` sobreposta no canto inferior esquerdo, com "Suscetibilidade HAND" (4 níveis) e seção "Marcadores" |
| 6 | Fallback estático funciona sem PostGIS? | ✅ **SIM, e foi exatamente o caminho exercitado.** `demo-map` retornou `static_fallback`; o mapa carregou a geometria de `/geo/blumenau_boundary.geojson` e `/geo/blumenau_hand_zones_simplified.geojson`. Banner explicativo `[fallback estático]` exibido |
| 7 | Erros no console? | ✅ **ZERO erros de JavaScript** |

**Chamadas de rede reais capturadas na tela `/mapa`:**

```
API backend:
  GET http://localhost:8000/api/geo/demo-map
  GET http://localhost:8000/api/geo/demo-points
GeoJSON estático:
  GET http://localhost:5173/geo/blumenau_boundary.geojson          (437 KB)
  GET http://localhost:5173/geo/blumenau_hand_zones_simplified.geojson (6,67 MB)
Tiles OpenStreetMap: 15 requisições
```

**Problemas específicos do mapa:**

1. **Zonas HAND cobrem área muito maior que Blumenau.** Verificado
   numericamente comparando os bounding boxes dos dois GeoJSON:

   | Camada | Longitude | Latitude |
   |---|---|---|
   | Zonas HAND | −49,2359 a −48,9126 | −27,2827 a −26,5261 |
   | Limite de Blumenau | −49,2014 a −49,0121 | −27,1326 a −26,6131 |

   As zonas extrapolam o município **nos quatro lados**. Isso é
   tecnicamente correto (o HAND foi calculado sobre a bacia contribuinte,
   não sobre o recorte municipal), mas visualmente a tela diz "Mapa de
   risco — Blumenau/SC" e pinta de vermelho/laranja territórios de Timbó,
   Indaial, Gaspar, Ilhota e Benedito Novo — todos identificáveis no mapa.
   **Um avaliador atento vai perguntar por que o piloto de Blumenau está
   colorindo cidades vizinhas.**

2. **Legenda rotula suscetibilidade com nomes de risco.** A legenda diz
   "Suscetibilidade HAND: Seguro / Atenção / Alerta / Crítico". Mas HAND é
   suscetibilidade topográfica estática, não risco atual — o vocabulário
   correto seria "muito baixa / baixa / média / alta". Usar as palavras de
   risco sugere que o mapa mostra risco em tempo real, contradizendo o que
   o próprio card "O que é HAND" (logo abaixo do mapa) explica.

3. **6,67 MB de GeoJSON baixados a cada abertura da tela.** Instantâneo em
   localhost, mas em rede real (apresentação com Wi-Fi de auditório) o
   mapa pode demorar visivelmente para pintar as zonas.

4. **Caminho PostGIS (`source: "postgis"`) nunca foi exercitado.** Só o
   fallback foi testado — o código do caminho real permanece não validado
   em execução.

### 5.9 Rota inexistente (`/xpto`) — descoberto fora do checklist

Testando uma URL qualquer que não existe (`/xpto`), a aplicação renderiza
um **`<body>` completamente vazio** — tela preta, sem header, sem menu, sem
mensagem. `router.tsx` não tem rota catch-all (`path="*"`).

Impacto na apresentação: qualquer erro de digitação na barra de endereço
durante a demo resulta numa tela preta sem saída — não há nem menu para
voltar.

---

## 6. Problemas encontrados

Consolidado, com severidade:

| # | Problema | Onde | Severidade |
|---|---|---|---|
| 1 | Landing sem nenhum link/botão — impossível entrar no sistema pela raiz | `/` | 🔴 Crítico |
| 2 | Rota inexistente renderiza tela preta vazia (sem catch-all/404) | `router.tsx` | 🔴 Crítico |
| 3 | `/api/geo/status` afirma `"connected"` com PostGIS fora do ar | `routers/geo.py` | 🔴 Crítico (honestidade) |
| 4 | 5 endpoints retornam 500 cru no Swagger | `/api/geo/*` | 🟠 Alto |
| 5 | Título "Alerta simulado — atenção" com badge "ALERTA" (contradição) | `/alertas` | 🟠 Alto |
| 6 | Zonas HAND pintam municípios vizinhos numa tela intitulada "Blumenau" | `/mapa` | 🟠 Alto |
| 7 | Página `/abrigos` ~90% vazia, mas com destaque de menu igual às reais | `/abrigos` | 🟠 Alto |
| 8 | Legenda do mapa usa vocabulário de risco para suscetibilidade | `MapLegend.tsx` | 🟡 Médio |
| 9 | Sobre afirma "27+ testes" — o real é 40 | `/sobre` | 🟡 Médio |
| 10 | Campos enriquecidos da F6.1 invisíveis na UI de Telemetria | `/telemetria` | 🟡 Médio |
| 11 | Rota `/alertas/:id` existe mas nenhum card linka para ela | `/alertas` | 🟡 Médio |
| 12 | Nível `atencao` nunca aparece (filtro sempre "Atenção (0)") | `/alertas` | 🟡 Médio |
| 13 | Limite municipal quase invisível sob as zonas HAND | `/mapa` | 🟡 Médio |
| 14 | 6,67 MB de GeoJSON por load da tela de mapa | `/mapa` | 🟢 Baixo |
| 15 | `/sobre` desperdiça metade direita da tela | `/sobre` | 🟢 Baixo |
| 16 | Telemetria abre sem nenhum resultado visível | `/telemetria` | 🟢 Baixo |

---

## 7. Prioridade das correções

**P0 — corrigir antes de qualquer apresentação (bloqueadores):**

1. Adicionar botão/CTA na Landing levando a `/painel` (problema 1).
2. Adicionar rota catch-all `path="*"` com página 404 dentro do `Layout`
   (problema 2).
3. Fazer `/api/geo/status` refletir a realidade — testar a conexão ou
   reportar `degraded`, como `demo-map` já faz corretamente (problema 3).

**P1 — corrigir se houver tempo antes da apresentação:**

4. Corrigir o título "Alerta simulado — atenção" → "— alerta" (problema 5).
5. Resolver `/abrigos`: esconder do menu ou marcar visivelmente como "em
   breve" (problema 7).
6. Adicionar nota no mapa explicando que as zonas HAND cobrem a bacia
   contribuinte, maior que o município (problema 6).
7. Dar fallback tratado aos 5 endpoints `geo/*` que hoje devolvem 500, ou
   documentar no Swagger que exigem PostGIS (problema 4).

**P2 — melhorias de qualidade, não bloqueiam:**

8. Legenda do mapa com vocabulário de suscetibilidade (problema 8).
9. Atualizar "27+ testes" para 40 (problema 9).
10. Expor campos F6.1 no formulário de Telemetria (problema 10).
11. Reforçar contorno do limite municipal no mapa (problema 13).
12. Ligar cards de alerta a `/alertas/:id` ou remover a rota (problema 11).
13. Ajustar um cenário para produzir nível `atencao` (problema 12).

---

## 8. O que está pronto para mostrar

Com confiança, sem ressalva:

- **`/painel` — Dashboard.** Melhor tela do produto. Métricas, ação
  recomendada, 3 cards de risco completos e explicáveis. É por onde a
  apresentação deve começar.
- **`/mapa` — Mapa de risco.** Funciona de verdade: Leaflet, tiles reais,
  4 zonas HAND coloridas, limite municipal, 3 marcadores com popup, legenda,
  fallback automático sem PostGIS, zero erro de console. É o diferencial
  visual que faltava na F5.0. (Preparar resposta para a pergunta sobre as
  cidades vizinhas coloridas.)
- **`/telemetria` — fluxo de avaliação ao vivo.** Clicar "Crítico" →
  "Avaliar risco" → ver o motor responder, e depois "Gerar payload
  UniMesh/LoRa simulado" mostrando `implemented: false`. Demonstração forte
  de honestidade técnica.
- **`/alertas`** (com a ressalva do título contraditório).
- **`/sobre`.** Conteúdo honesto e bem estruturado; ótimo para responder
  "o que é real e o que é simulado".
- **Suíte de testes.** `pytest` rodando 40/40 na frente do avaliador é
  argumento forte.
- **`/docs` (Swagger)** — desde que a navegação seja dirigida aos endpoints
  que funcionam.

---

## 9. O que não deve ser mostrado ainda

- **`/abrigos`** — página vazia. Não abrir espontaneamente.
- **`/alertas/:id`** — placeholder textual, sem dado real.
- **Landing (`/`) como ponto de entrada** — abrir a demo direto em
  `/painel` enquanto o CTA não existir.
- **Os 5 endpoints `geo/*` que retornam 500** no Swagger:
  `hand-zones`, `hand-zones/summary`, `municipality/blumenau`,
  `basins/blumenau`, `point-risk-context`.
- **`/api/geo/status`** — afirma `"connected"` sem estar. Evitar até
  corrigir; se questionado, admitir que o PostGIS não está no ar e que o
  sistema opera em fallback (o que, em si, é um ponto positivo de
  engenharia).
- **Digitação livre de URL durante a apresentação** — erro de digitação
  cai em tela preta.

---

## 10. Plano de correção recomendado

Sequência sugerida para uma F6.3, em ordem de custo/benefício. Nenhum item
exige feature nova nem mexer em repositório legado.

**Rodada 1 — 3 correções P0 (estimativa: pequena, ~1 arquivo cada)**

1. `apps/web/src/pages/Landing.tsx` — adicionar `<Link to="/painel">` com
   botão "Entrar no painel" (e talvez um secundário para `/sobre`).
2. `apps/web/src/router.tsx` — adicionar `<Route path="*" element={<NotFound/>}/>`
   dentro do grupo `<Layout>`, com componente novo mínimo
   (`components/NotFound.tsx`) oferecendo link de volta ao painel.
3. `services/api/app/routers/geo.py` — `geo_status()` passa a tentar um
   `SELECT 1` e reportar `connected` / `degraded` conforme o resultado,
   sem vazar credencial na mensagem (mesmo padrão já usado e testado em
   `get_demo_map()`). Acrescentar teste em `tests/test_geo_demo.py`.

**Rodada 2 — 4 correções P1**

4. `apps/web/src/pages/Alertas.tsx` — corrigir `SCENARIO_TITLES.alerta`.
5. `apps/web/src/components/Layout.tsx` — marcar "Abrigos" com tag "em
   breve" ou removê-lo do `NAV_ITEMS` até ter conteúdo.
6. `apps/web/src/pages/RiskMap.tsx` — nota curta abaixo do mapa explicando
   a extensão da bacia contribuinte vs. limite municipal.
7. `services/api/app/routers/geo.py` — envolver os 5 endpoints PostGIS num
   tratamento que devolva 503 com mensagem clara em vez de 500 cru
   (mantendo o cuidado já existente de não vazar credencial).

**Rodada 3 — P2, se sobrar tempo**

8. Vocabulário da legenda (`MapLegend.tsx`).
9. Contagem de testes em `Sobre.tsx` (40, e de preferência sem número
   fixo — ou aceitar que envelhece).
10. Campos enriquecidos da F6.1 no formulário de `Telemetria.tsx`,
    ao menos `sensor_id`, `station_name` e chuva por janela.
11. Reforço visual do limite municipal no mapa (peso maior / halo escuro).

**Validação após cada rodada:** `python -m pytest` (esperado 40+ passando)
e `npm run build` (esperado sem erro de TypeScript).

---

## Encerramento

- Backend: **passou** (40/40).
- Frontend: **buildou** (sem erro de TypeScript).
- Mapa: **abriu e funcionou**, inclusive o fallback sem PostGIS.
- Erros de JavaScript no console: **zero**, nas 7 telas.
- Bloqueadores reais para apresentação: **3** (landing sem CTA, rota
  inexistente em tela preta, `geo/status` mentindo sobre conexão).
- **Nenhum código alterado. Nada commitado.**

---

# Correções F6.2.1 aplicadas

Rodada de correção executada logo após esta auditoria, atacando os
bloqueadores e os itens de alta prioridade. **Nada commitado nesta rodada
também** — as mudanças estão no working tree.

## Resumo

| # | Problema da auditoria | Severidade | Status |
|---|---|---|---|
| 1 | Landing sem nenhum link | 🔴 Crítico | ✅ Corrigido |
| 2 | Rota inexistente = tela preta | 🔴 Crítico | ✅ Corrigido |
| 3 | `/api/geo/status` mente sobre PostGIS | 🔴 Crítico | ✅ Corrigido |
| 4 | 5 endpoints geo com 500 cru | 🟠 Alto | ✅ Corrigido (503) |
| 5 | Título "— atenção" com badge "ALERTA" | 🟠 Alto | ✅ Corrigido |
| 6 | Zonas HAND extrapolam Blumenau sem explicação | 🟠 Alto | ✅ Corrigido (aviso + limite visível) |
| 7 | `/abrigos` ~90% vazia | 🟠 Alto | ✅ Corrigido (opção A) |
| 8 | Legenda usa vocabulário de risco para suscetibilidade | 🟡 Médio | ✅ Corrigido |
| 9 | Sobre afirma "27+ testes" | 🟡 Médio | ✅ Corrigido (40) |
| 10 | Limite municipal invisível no mapa | 🟡 Médio | ✅ Corrigido (halo + peso 3) |

## Detalhe das correções

### 1. Landing com CTAs (`apps/web/src/pages/Landing.tsx`)

Reescrita. Agora tem 4 CTAs navegáveis (`/painel` como primário destacado,
`/mapa`, `/telemetria`, `/sobre`), 3 cards de proposta de valor
(Diferencial = HAND, Usuário = Defesa Civil, Motor de risco = explicável),
badge "Prova de conceito — dados simulados" no topo e rodapé reforçando
software-only/hardware-agnóstico/não substitui a Defesa Civil. Também
passou a usar os tokens `navy-*` do tema (antes usava `slate-950` solto,
fora do design system).

**Verificado:** DOM da raiz agora contém `href="/painel"`, `href="/mapa"`,
`href="/telemetria"`, `href="/sobre"`.

### 2. Página 404 (`apps/web/src/pages/NotFound.tsx` + `router.tsx`)

Componente novo, renderizado por uma rota catch-all `path="*"` **dentro do
`<Layout>`** — mantém header e nav, então o usuário nunca fica sem saída.
Mostra a rota inválida (`location.pathname`), explica que não é falha do
sistema e oferece 4 atalhos.

**Verificado:** `/qualquer-coisa` agora renderiza "Página não encontrada"
com nav completa e 7 links, em vez de `<body>` vazio.

### 3. `/api/geo/status` honesto (`services/api/app/routers/geo.py`)

O endpoint deixou de retornar `"connected"` fixo. Agora executa
`SELECT 1` + `SELECT COUNT(*) FROM hand_zones` e classifica:

- `connected` — banco respondeu **e** `hand_zones` tem linhas;
- `degraded` — banco respondeu, mas `hand_zones` está vazia (aponta o
  `export_to_postgis.py export-all`);
- `unavailable` — banco não respondeu.

Resposta ganhou `postgis_available`, `hand_zones_loaded`, `source` e
`message`. Nunca devolve 500 e nunca vaza credencial (loga só
`type(exc).__name__`, mesmo padrão já usado em `get_demo_map()`).

**Verificado em runtime:**
```json
{"module":"geo","status":"unavailable","postgis_available":false,
 "hand_zones_loaded":0,"source":"static_fallback",
 "message":"PostGIS não respondeu neste ambiente. ..."}
```

### 4. Endpoints PostGIS com 503 (`services/api/app/routers/geo.py`)

Os 5 endpoints que leem banco foram envolvidos em `try/except
SQLAlchemyError` chamando o helper novo `_raise_postgis_unavailable()`, que
devolve **503** com detalhe único e acionável:

> "PostGIS indisponível neste ambiente. Use /api/geo/demo-map para o
> fallback estático da demo."

Sem reescrever a camada geo e sem esconder que os endpoints dependem de
PostGIS.

**Verificado em runtime:** os 5 endpoints passaram de `HTTP 500` para
`HTTP 503` com a mensagem acima.

### 5. Contradição nos alertas (`apps/web/src/pages/Alertas.tsx`)

O mapa fixo `SCENARIO_TITLES` (que rotulava o cenário `alerta` como
"— atenção") foi substituído por `scenarioTitle(level)`, que deriva o
título do **nível real** usando `RISK_THEME` — a mesma fonte que alimenta o
badge, então título e badge não podem mais divergir. Termo genérico passou
de "Alerta simulado" para **"Evento simulado"**, evitando usar "alerta"
como palavra genérica e como nível ao mesmo tempo.

**Verificado:** títulos renderizados são "Evento simulado — Seguro",
"Evento simulado — Alerta", "Evento simulado — Crítico".

### 6. Aviso da bacia contribuinte + limite visível (`RiskMap.tsx`, `MapLegend.tsx`)

- **Aviso:** `SectionCard` novo logo abaixo do mapa — "Por que as zonas HAND
  ultrapassam o limite de Blumenau" — explicando que representam a área
  hidrologicamente contribuinte, que água não respeita divisa municipal, e
  que os dados **não foram recortados de propósito** para não descartar a
  bacia que influencia o território.
- **Limite mais visível:** desenhado em duas passadas — halo escuro
  (`#040b14`, weight 7) por baixo e linha ciano (`#22d3ee`, weight 3) por
  cima. Removido o `dashArray`, que enfraquecia a linha. Antes o contorno
  renderizava mas sumia sobre o preenchimento das zonas.
- **Legenda:** ganhou seção "Limite municipal — Blumenau/SC".

### 7. Legenda com vocabulário de suscetibilidade (`MapLegend.tsx`)

Os rótulos passaram de "Seguro / Atenção / Alerta / Crítico" (nomes de
**risco**) para "Muito baixa / Baixa / Média / Alta" (nomes de
**suscetibilidade HAND**). As cores continuam as do `RISK_THEME` por
consistência visual, mas o texto não sugere mais risco em tempo real —
alinhando a legenda com o que o próprio card "O que é HAND" explica.

### 8. `/abrigos` demonstrativo (`apps/web/src/pages/Shelters.tsx`)

Escolhida a **opção A**. A tela agora mostra 4 cards de métrica
(3 abrigos, capacidade 460, ocupação 305, 155 vagas) e 3 abrigos simulados
com barra de ocupação colorida e status (Disponível / Quase lotado /
Lotado), mais um bloco "O que falta para isto virar funcionalidade real".

**Honestidade preservada em 4 camadas:** aviso `[DEMO]` explícito dizendo
que estão fixos no frontend e não vêm do banco; sufixo "(simulado)" no nome
de cada abrigo; tag `SIMULADO` em cada card; docstring do arquivo marcando
os dados como temporários e apontando a F7. Nenhum backend novo, nenhuma
rota nova, `shelters.py` continua placeholder.

### 9. Contagem de testes (`apps/web/src/pages/Sobre.tsx`)

"27+ testes automatizados sem depender de banco" → **"48 testes
automatizados no backend, sem depender de banco"**.

Nota: a tarefa pedia "40", mas os 8 testes adicionados nesta mesma rodada
levaram a suíte de 40 para 48. Escrever 40 recriaria na hora o problema que
a correção existia para resolver (número desatualizado na UI), então o
valor usado é o real da suíte: **48**.

## Testes adicionados

8 testes novos em `services/api/tests/test_geo_demo.py`:

| Teste | Garante |
|---|---|
| `test_geo_status_never_returns_500_without_postgis` | `/api/geo/status` não quebra sem banco |
| `test_geo_status_has_expected_shape` | Contrato da resposta (6 chaves, tipos) |
| `test_geo_status_never_claims_connected_without_postgis` | **O núcleo:** `connected` exige banco vivo + `hand_zones` populada |
| `test_geo_status_is_consistent_with_demo_map_source` | `status` e `demo-map` não podem se contradizer |
| `test_geo_status_never_leaks_credentials` | Sem senha/URL/driver na mensagem |
| `test_postgis_endpoints_never_return_500` | Os 5 endpoints devolvem 200/404/503, nunca 500 |
| `test_postgis_endpoints_give_actionable_message_when_unavailable` | 503 aponta o fallback |
| `test_postgis_endpoints_never_leak_credentials_in_error` | Sem credencial no detalhe do erro |

Os testes foram escritos para valer **nos dois ambientes** (com e sem
PostGIS) — não travam num caminho só, verificam consistência.

## Validação da F6.2.1

```
Backend : 48 passed, 1 warning in 0.80s      (era 40, +8 novos)
Frontend: tsc -b && vite build → ✓ built in 729ms
          dist/assets/index-CcBQ5_dt.js  426.19 kB │ gzip: 129.88 kB
```

| Verificação pedida | Resultado |
|---|---|
| `/` tem links navegáveis | ✅ 4 CTAs |
| Rota inexistente abre 404 amigável | ✅ com nav e 4 atalhos |
| `/api/geo/status` não diz "connected" com banco fora | ✅ retorna `unavailable` |
| `/api/geo/status` não retorna 500 | ✅ HTTP 200 |
| `/api/geo/demo-map` continua com `static_fallback` | ✅ inalterado |
| `/alertas` sem contradição título/badge | ✅ derivado do nível real |
| `/sobre` informa a contagem real de testes | ✅ 48 (não mais "27+") |
| `/mapa` renderiza zonas HAND + aviso da bacia | ✅ + limite agora visível |
| `/abrigos` não parece quebrada | ✅ 3 abrigos simulados + métricas |
| Erros de JavaScript no console | ✅ zero, nas telas revalidadas |

## O que continua pendente depois da F6.2.1

Itens conhecidos, nenhum bloqueador de apresentação:

1. **Caminho PostGIS (`source: "postgis"`) segue não exercitado** — todo o
   comportamento validado é o de fallback. Continua sendo a maior lacuna de
   validação do projeto.
2. **Nível `atencao` nunca aparece** nos alertas (filtro "Atenção (0)") — os
   3 cenários fixos produzem só seguro/alerta/crítico.
3. **Rota `/alertas/:id` continua órfã** — existe, renderiza placeholder,
   nenhum card linka para ela.
4. **Campos enriquecidos da F6.1 seguem fora do formulário** de
   `/telemetria` (existem na API, não na UI).
5. **6,67 MB de GeoJSON por load** da tela de mapa.
6. **`/sobre` ainda desperdiça a metade direita** da tela em telas largas.
7. **Contagem de testes no `/sobre` é número fixo** (agora 40, real 48) —
   vai envelhecer de novo; considerar remover o número.
8. **Nenhum teste automatizado de frontend** — validação das telas continua
   manual/visual.
