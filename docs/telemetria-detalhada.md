# Telemetria — Detalhada (F6.1)

> A crítica da rodada anterior foi direta: "a telemetria está rasa". Este
> documento explica o que existe, por que é simulado, o que foi ampliado
> nesta fase (F6.1) e o que continua como melhoria de fase futura — sem
> fingir sensor, hardware ou transmissão real em nenhum momento (regras 6 e
> 7 do escopo desta rodada).

## O que é telemetria no FloodGuard

"Telemetria", aqui, é o conjunto de leituras de campo que alimentam o motor
de risco: chuva acumulada e nível d'água, principalmente. No FloodGuard
atual, essas leituras **nunca vêm de um sensor físico** — vêm de um
formulário preenchido manualmente (`Telemetria.tsx`) ou de cenários fixos
definidos em código (`DEMO_SCENARIOS`, `services/simulator/simulated_payload_example.json`).
O caminho de processamento (normalização → motor de risco → payload de
comunicação) é código real e testado; só a **origem do dado** é simulada.

## Por que hoje ela é simulada

Por decisão de escopo do projeto (`docs/decisoes-arquitetura.md`): FloodGuard
é **software-only, hardware-agnóstico** nesta fase. Não há estação
telemétrica real instalada em Blumenau, não há LoRaWAN/Meshtastic físico, e
o projeto explicitamente não fabrica nem depende de nenhum dispositivo
específico (`docs/limitacoes.md`, itens 1–4). Simular a telemetria permite
validar o motor de risco e a experiência do operador da Defesa Civil sem
depender de hardware que ainda não existe.

## Quais campos existem hoje (antes da F6.1)

Fluxo de entrada (`app.engine.telemetry_normalizer.normalize()`) aceitava
só o mínimo para o motor de risco funcionar:

| Campo | Obrigatório? | Aliases aceitos |
|---|---|---|
| `latitude` | Sim | `lat` |
| `longitude` | Sim | `lon`, `lng` |
| `rainfall_mm` | Sim | `rainfall`, `precipitation_mm`, `chuva_mm`, `chuva_acumulada_mm` |
| `water_level_m` | Sim | `water_level`, `nivel_agua_m`, `nivel_agua` |
| `previous_water_level_m` | Não | `previous_water_level`, `nivel_agua_anterior_m` |
| `station_id` | Não | `device_id`, `id` |
| `communication_status` | Não (default `"unknown"`) | `comm_status`, `status_comunicacao` |
| `timestamp` | Não (default: agora) | `recorded_at`, `datetime` |

Saída fixa sempre: `source="simulation"`, `hardware_implemented=False`.

## Por que ela ainda estava rasa

Comparando com o que uma estação telemétrica de campo real normalmente
reporta, faltava:

- **Identidade da estação** além de um ID solto — nome legível, região.
- **Chuva em múltiplas janelas de tempo.** Só havia "chuva acumulada" sem
  dizer em qual janela — 15 minutos e 24 horas contam histórias
  completamente diferentes para decisão operacional, e o payload não
  distinguia isso.
- **Tendência de nível d'água como campo de primeira classe.** O motor já
  calculava tendência internamente (`risk_rules.trend_factor`), mas o
  normalizador não expunha isso como campo legível no payload — só
  `previous_water_level_m` cru.
- **Saúde do sensor** (bateria, qualidade de sinal, qualidade da leitura) —
  informação que qualquer estação IoT real reporta e que importa para
  decidir *quanto confiar* numa leitura, mas que não existia em lugar
  nenhum do payload.
- **Nenhum sinal explícito de "isso é simulado" no nível do campo além dos
  dois já existentes** (`source`, `hardware_implemented`) — o resto do
  payload não deixava claro para um consumidor externo que outros campos
  (ex.: bateria) também seriam sintéticos quando adicionados.

## Como seria uma telemetria mais realista

Um payload de estação telemétrica real de monitoramento de enchente
tipicamente inclui identidade, múltiplas janelas de chuva, nível d'água com
tendência derivada, e telemetria de saúde do próprio dispositivo — não só
"o valor da grandeza física".

### Campos que deveriam entrar (conforme solicitado nesta rodada)

| Campo | Tipo | Por quê |
|---|---|---|
| `sensor_id` | string | Identifica o sensor físico (futuro), distinto de `station_id` (que pode agregar múltiplos sensores numa estação) |
| `station_name` | string | Nome legível para o operador — "sensor-42" não significa nada numa tela, "Estação Velha" sim |
| `region` | string | Já existia no schema de risco (`RiskEvaluationRequest.region`), mas não no schema de telemetria — inconsistência corrigida na F6.1 |
| `lat`/`lon` | float | Já existiam |
| `rainfall_mm_15m` | float | Chuva na última janela curta — sinal mais rápido de evento em curso |
| `rainfall_mm_1h` | float | Janela intermediária |
| `rainfall_mm_6h` | float | Contexto de médio prazo |
| `rainfall_mm_24h` | float | Contexto de saturação do solo |
| `water_level_m` | float | Já existia |
| `previous_water_level_m` | float | Já existia |
| `water_level_delta_m` | float | Derivado (`water_level_m − previous_water_level_m`), mas explicitado como campo em vez de forçar o consumidor a calcular |
| `trend` | string (`"subindo"`/`"descendo"`/`"estavel"`) | Versão legível do que `risk_rules.trend_factor()` já calcula como número |
| `battery_percent` | float 0–100 | Saúde do dispositivo — sinaliza leitura pouco confiável antes de faltar completamente |
| `signal_quality` | string | Qualidade de comunicação do sensor (não confundir com `communication_status`, que é do link de rede) |
| `communication_status` | string | Já existia |
| `reading_quality` | string | Avaliação da leitura em si (ex.: `"confiavel"`, `"suspeita"`) — distinto de qualidade de sinal |
| `source` | string, fixo `"simulation"` | Já existia — nunca sobrescrito pelo payload de entrada |
| `hardware_implemented` | bool, fixo `False` | Já existia — nunca sobrescrito pelo payload de entrada, mesmo que o payload tente mandar `true` (testado, ver abaixo) |
| `timestamp` | datetime | Já existia |

## O que foi implementado na F6.1 (código real, não só documentação)

Todos os campos acima **exceto `lat`/`lon`/`water_level_m`/`previous_water_level_m`/
`communication_status`/`source`/`hardware_implemented`/`timestamp`** (que já
existiam) foram adicionados como **opcionais** em
`services/api/app/schemas/telemetry.py::NormalizedTelemetryReading` e
normalizados em `services/api/app/engine/telemetry_normalizer.py::normalize()`:

- `sensor_id`, `station_name`, `region` — aceitos direto do payload bruto
  (com aliases em português para `station_name`/`region`), `None` se
  ausentes.
- `rainfall_mm_15m/1h/6h/24h` — aceitos direto, `None` se ausentes. **Não
  têm alias** (são campos novos, sem histórico de nome divergente).
- `water_level_delta_m` — se o payload já mandar o campo, usa ele; senão,
  **calcula automaticamente** a partir de `water_level_m − previous_water_level_m`
  quando há leitura anterior; `None` se não há como calcular.
- `trend` — se o payload já mandar, usa; senão, **deriva** de
  `water_level_delta_m`: `"subindo"` se delta > 0.05 m, `"descendo"` se
  delta < −0.05 m, `"estavel"` caso contrário, `None` se não há delta.
- `battery_percent` — aceito do payload (alias `battery`, o mesmo nome usado
  em `TelemetryReading`/`simulated_payload_example.json`), **clampado para
  `[0, 100]`** (mesma filosofia de `_clamp_non_negative` já usada para
  chuva/nível — ruído de simulação não derruba a leitura inteira).
- `signal_quality`, `reading_quality` — aceitos direto, `None` se ausentes.
- `hardware_implemented` e `source` **continuam fixos** (`False` e
  `"simulation"`) — o normalizador nem olha essas chaves no payload de
  entrada. Testado explicitamente
  (`test_hardware_implemented_is_always_false_even_if_payload_claims_otherwise`)
  para impedir que um payload externo force o sistema a "mentir" que há
  hardware real — alinhado com a regra 6 desta rodada ("não fingir hardware
  real").

### Compatibilidade preservada

- Nenhum campo antigo foi removido ou teve nome/tipo alterado.
- Todos os campos novos são opcionais com default `None` — um payload
  mínimo antigo (`{latitude, longitude, rainfall_mm, water_level_m}`)
  continua funcionando exatamente como antes.
- Os 40 testes existentes (incluindo os 6 originais de
  `test_telemetry_normalizer.py`) continuam passando sem alteração — ver
  Parte G do relatório de execução desta fase.
- 6 testes novos cobrem especificamente os campos enriquecidos: ausência
  (payload mínimo), presença, derivação de delta/tendência em 3 cenários
  (subindo/descendo/estável), clamp de bateria, e a garantia de
  `hardware_implemented`/`source` fixos.

## Como esses campos alimentam o motor de risco

**Não alimentam — deliberadamente, nesta fase.** O motor de risco
(`services/api/app/engine/risk_engine.py`) continua consumindo só
`rainfall_mm`, `water_level_m` e a tendência calculada internamente por
`risk_rules.trend_factor(water_level_m, previous_water_level_m)`. Os campos
novos são normalizados e devolvidos na resposta de
`POST /api/telemetry/normalize`, mas `POST /api/telemetry/mesh-payload`
(que é quem de fato chama o motor) continua reconstruindo o
`RiskEvaluationRequest` só com os 4 campos que o motor sempre usou —
nenhuma mudança na fórmula, nenhum novo peso, nenhuma calibração nova
introduzida às pressas.

Essa é uma decisão explícita desta rodada: os campos enriquecidos
**preparam** uma evolução futura do motor (ex.: usar `rainfall_mm_1h` para
detectar um pico de chuva rápido que `rainfall_mm` acumulado sozinho não
distingue, ou reduzir a confiança de uma leitura quando `reading_quality`
indica problema), mas essa evolução do motor em si fica para uma fase
futura, com seu próprio ciclo de teste — mudar a fórmula de risco não era o
pedido desta rodada.

## Quais campos são usados agora

`rainfall_mm`, `water_level_m`, `previous_water_level_m` (via
`trend_factor`), `latitude`/`longitude` (só para eco/contexto, o motor não
faz nada geoespacial com eles diretamente — isso é `hand_class_id`/`region`
via `spatial_context.py`), `communication_status` (eco, não afeta score),
`hand_class_id`/`hand_risk_weight`/`region` (contexto espacial, ver
`docs/hand-processamento-detalhado.md`).

## Quais campos ficam como melhoria da próxima fase

- Usar `rainfall_mm_15m`/`1h`/`6h`/`24h` para detectar padrão de chuva (pico
  vs. acumulado lento) em vez de um único número — provável insumo direto
  para o nowcasting U-RNN citado no roadmap.
- Usar `battery_percent`/`signal_quality`/`reading_quality` para reduzir
  `confidence` da avaliação quando a leitura é duvidosa — hoje `confidence`
  só cai por ausência de contexto HAND (`CONFIDENCE_FALLBACK`), nunca por
  qualidade da leitura em si.
- Popular `telemetry_readings` no PostGIS (tabela já existe desde a F1,
  `db/migrations/002_core_tables.sql`) com o histórico de leituras — hoje
  nenhum router grava nela.
- Conectar `Telemetria.tsx` aos novos campos no formulário (hoje o
  formulário só manda os campos que já existiam antes da F6.1 — os campos
  novos são consumíveis via API, mas ainda não têm input na UI).

## Exemplo de payload simples (o que já funcionava antes da F6.1, continua igual)

```json
{
  "latitude": -26.9194,
  "longitude": -49.0661,
  "rainfall_mm": 42.3,
  "water_level_m": 1.85
}
```

## Exemplo de payload enriquecido (novo na F6.1)

```json
{
  "sensor_id": "sensor-42",
  "station_id": "sim-blu-001",
  "station_name": "Estação Velha",
  "region": "Velha",
  "latitude": -26.9194,
  "longitude": -49.0661,
  "rainfall_mm": 42.3,
  "rainfall_mm_15m": 3.1,
  "rainfall_mm_1h": 12.4,
  "rainfall_mm_6h": 30.0,
  "rainfall_mm_24h": 55.2,
  "water_level_m": 1.85,
  "previous_water_level_m": 1.60,
  "battery_percent": 87.5,
  "signal_quality": "boa",
  "communication_status": "ok",
  "reading_quality": "confiavel"
}
```

Resposta normalizada correspondente inclui `water_level_delta_m: 0.25`,
`trend: "subindo"` (derivados automaticamente), além de todos os campos
acima ecoados, mais `source: "simulation"` e `hardware_implemented: false`
fixos.

## Ciclo de atualização recomendado

| Fase | Intervalo | Justificativa |
|---|---|---|
| MVP (atual) | 1 hora | Suficiente para decisão manual do operador da Defesa Civil olhando o painel periodicamente — não há automação de polling hoje, cada avaliação é disparada manualmente via `Telemetria.tsx` ou script |
| Demo operacional | 15 minutos | Intervalo citado para uma futura simulação contínua (cron/scheduler ainda não implementado) — alinhado com a granularidade de `rainfall_mm_15m` já suportada no schema |
| Nowcasting/U-RNN futuro | 10–15 minutos | Consistente com a granularidade que o modelo de nowcasting (roadmap, `urbanflood_urnn_demo`) precisaria para prever chuva de curto prazo — nenhum código de nowcasting existe ainda neste repositório, valor é referência de planejamento, não implementação |

Nenhum desses ciclos está automatizado hoje — toda avaliação de risco no
FloodGuard é disparada por uma chamada HTTP explícita (formulário, teste, ou
cenário fixo), não por um agendador rodando em background.
