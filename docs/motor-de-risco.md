# Motor de Risco — FloodGuard (F3)

## O que é

O motor de risco combina contexto espacial HAND (suscetibilidade
topográfica, ver [metodologia-hand.md](metodologia-hand.md)) com variáveis
dinâmicas — chuva acumulada, nível d'água e tendência temporal — numa
fórmula de fusão simples e **explicável**: toda avaliação vem acompanhada de
uma justificativa textual e dos fatores que entraram no cálculo, não só um
número.

Código: `services/api/app/engine/`
(`risk_engine.py`, `risk_rules.py`, `risk_explanation.py`,
`spatial_context.py`, `telemetry_normalizer.py`, `mesh_payload.py`).

## Créditos

O padrão de fusão espacial + risco explicável tem origem no
`techguard-sentinela` (autoria de João Benvenutti, reaproveitado sob acordo
de equipe — ver [autoria-licenca.md](autoria-licenca.md)). A fórmula
implementada aqui é **própria da F3** — mais simples que o motor
HAND+NDVI+NDBI+chuva efetiva+saturação hidrológica original do
`techguard-sentinela`, não um port dele. Ver
[decisoes-arquitetura.md](decisoes-arquitetura.md#motor-de-risco-canônico)
para o histórico dessa decisão.

A classificação final em 4 níveis, a referência de chuva (150 mm) e o
payload UniMesh/LoRa simulado vêm do `americas_techguard_final_poc`
(autoria de Pedro Zanette).

## Fórmula

```
score = 0.45 * hand_risk_weight
      + 0.30 * rainfall_factor
      + 0.20 * water_level_factor
      + 0.05 * trend_factor
```

Os 4 pesos somam 1.0. `score` final é limitado (clamp) entre 0.0 e 1.0.

### Fatores (0.0 a 1.0)

| Fator | Como é calculado | Referência de normalização |
|---|---|---|
| `hand_risk_weight` | Peso da classe HAND do ponto (0.1 a 0.9) — ver [metodologia-hand.md](metodologia-hand.md#classes-hand-usadas-no-floodguard) | Classes reais de Blumenau (F2) |
| `rainfall_factor` | `chuva_acumulada_mm / 150` | 150 mm — mesma referência de `americas_techguard_final_poc/src/risk_engine.py` |
| `water_level_factor` | `nivel_agua_m / 3.0` | 3,0 m — valor demonstrativo de PoC para a bacia do Itajaí em Blumenau, **não** é cota oficial de alerta da Defesa Civil |
| `trend_factor` | `0.5 + (nivel_atual − nivel_anterior) / 0.5 × 0.5`, limitado a 0–1 | 0.5 = estável ou tendência desconhecida (sem leitura anterior); > 0.5 = subindo; < 0.5 = descendo |

Todos os fatores são limitados (clamp) entre 0.0 e 1.0 antes de entrar na
fórmula — uma chuva de 300 mm não faz o fator de chuva passar de 1.0.

## Classificação

| Faixa de `risk_score` | `risk_level` |
|---|---|
| 0.00 – 0.25 | `seguro` |
| 0.26 – 0.50 | `atencao` |
| 0.51 – 0.75 | `alerta` |
| 0.76 – 1.00 | `critico` |

## Fallback sem HAND

Se nem `hand_risk_weight`/`hand_class_id` nem `region` (lookup mockado)
resolverem um contexto espacial, o motor **não inventa** um peso HAND. Em
vez disso:

- `spatial_context_available: false` na resposta;
- o peso do fator HAND (0.45) é **redistribuído proporcionalmente** entre
  chuva, nível d'água e tendência — os pesos relativos entre esses três
  continuam os mesmos (0.30:0.20:0.05), só a soma sobe pra 1.0 sem o HAND;
- `confidence` cai de 0.95 para 0.55 (valores demonstrativos, não
  estatísticos — ver [limitacoes.md](limitacoes.md));
- a `explanation` deixa explícito que o contexto HAND não estava disponível.

## Resolução do contexto espacial

Ordem de prioridade em `risk_engine._resolve_spatial_context`:

1. `hand_risk_weight` vier explícito no payload — usa direto;
2. `hand_class_id` vier — resolve contra as 4 classes conhecidas
   (`spatial_context.HAND_CLASSES_BY_ID`);
3. `region` vier (nome de bairro simulado) — lookup mockado
   (`spatial_context.MOCK_REGION_TO_HAND_CLASS`), **sem** consultar PostGIS;
4. nenhum dos três — fallback.

Não há dependência obrigatória de banco: os testes unitários e os cenários
de demo rodam inteiramente sem PostGIS.

## Exemplos

### Alto risco (HAND alto + chuva alta + nível alto)

Entrada: `hand_class_id=0, hand_risk_weight=0.9, rainfall_mm=140, water_level_m=2.8, previous_water_level_m=2.2`

```json
{
  "risk_level": "critico",
  "risk_score": 0.9217,
  "confidence": 0.95,
  "spatial_context_available": true,
  "factors": {"hand_weight": 0.9, "rainfall_factor": 0.9333, "water_level_factor": 0.9333, "trend_factor": 1.0},
  "explanation": "A região apresenta alta suscetibilidade, chuva acumulada elevada e nível d'água elevado e em crescimento, resultando em risco critico.",
  "recommended_action": "Acionar protocolo de emergência da Defesa Civil e considerar evacuação preventiva."
}
```

### Baixo risco (todos os fatores baixos)

Entrada: `hand_class_id=3, hand_risk_weight=0.1, rainfall_mm=5, water_level_m=0.3, previous_water_level_m=0.3`

```json
{
  "risk_level": "seguro",
  "risk_score": 0.1,
  "confidence": 0.95,
  "spatial_context_available": true,
  "factors": {"hand_weight": 0.1, "rainfall_factor": 0.0333, "water_level_factor": 0.1, "trend_factor": 0.5},
  "explanation": "A região apresenta muito baixa suscetibilidade, chuva acumulada baixa e nível d'água baixo e estável, resultando em risco seguro.",
  "recommended_action": "Nenhuma ação necessária. Manter monitoramento de rotina."
}
```

### Fallback (sem HAND)

Entrada: `rainfall_mm=50, water_level_m=1.0` (sem `hand_class_id`, `hand_risk_weight` nem `region`)

```json
{
  "risk_level": "atencao",
  "risk_score": 0.3485,
  "confidence": 0.55,
  "spatial_context_available": false,
  "factors": {"hand_weight": 0.0, "rainfall_factor": 0.3333, "water_level_factor": 0.3333, "trend_factor": 0.5},
  "explanation": "A região apresenta chuva acumulada baixa e nível d'água baixo e estável, resultando em risco atencao. Contexto espacial HAND não estava disponível para este ponto — avaliação considerou apenas chuva, nível d'água e tendência, com confiança reduzida."
}
```

Reproduzível com `GET /api/scenarios/demo` (3 cenários fixos) e nos testes
unitários em `services/api/tests/test_risk_engine.py`.

## Endpoints

| Rota | Método | Descrição |
|---|---|---|
| `/api/risk/status` | GET | Status do módulo |
| `/api/risk/evaluate` | POST | Avalia uma leitura (`RiskEvaluationRequest` → `RiskEvaluationResponse`) |
| `/api/risk/evaluate-batch` | POST | Avalia uma lista de leituras |
| `/api/scenarios/demo` | GET | Roda os 3 cenários fixos (seguro/alerta/crítico) pelo motor real |
| `/api/telemetry/normalize` | POST | Normaliza payload bruto simulado |
| `/api/telemetry/mesh-payload` | POST | Avalia risco + empacota payload UniMesh/LoRa simulado |

## Payload UniMesh/LoRa simulado

`services/api/app/engine/mesh_payload.py` empacota um `RiskEvaluationResponse`
já calculado num payload compacto — **sem** rádio, socket ou porta serial.
`implemented` é sempre `false` e `source` é sempre `"simulation"`, mesmo em
risco crítico (testado explicitamente em `test_mesh_payload.py`).

## Limitações

Ver [limitacoes.md](limitacoes.md). Resumo: pesos e referências de
normalização (150 mm de chuva, 3,0 m de nível d'água) são valores
demonstrativos de PoC, não calibrados com dados reais de campo. O motor não
substitui a análise da Defesa Civil.

## Próximos passos

- Motor NDVI/NDBI/Tc completo do `techguard-sentinela` como alternativa mais
  sofisticada — avaliar se substitui ou complementa a fórmula atual.
- Nowcasting (U-RNN, `urbanflood_urnn_demo`) como entrada opcional futura no
  fator de chuva, no lugar da chuva acumulada simples — ver
  [roadmap.md](roadmap.md).
- Persistir avaliações em `risk_assessments` (PostGIS) — hoje o motor roda
  sem gravar nada.
- Conectar `spatial_context.py` a uma consulta real em `hand_zones`
  (PostGIS) como alternativa ao lookup mockado por região.
