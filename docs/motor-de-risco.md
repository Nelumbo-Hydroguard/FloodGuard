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

Os limiares são intervalos semiabertos — o valor da fronteira cai sempre na
faixa seguinte (`classify_risk` em `risk_rules.py` compara com `<`). Um
score de exatamente 0.25, por exemplo, classifica como `atencao`, não como
`seguro`.

| Faixa de `risk_score` | `risk_level` |
|---|---|
| 0.00 ≤ score < 0.25 | `seguro` |
| 0.25 ≤ score < 0.50 | `atencao` |
| 0.50 ≤ score < 0.75 | `alerta` |
| 0.75 ≤ score ≤ 1.00 | `critico` |

## Mensagens: dois públicos, duas camadas

O motor atende **operador**, não cidadão. Confundir os dois foi um problema
real: até esta revisão existia uma única frase por nível, exibida em toda
tela sob o rótulo genérico "Ação recomendada", e o texto do nível crítico
dizia *"considerar evacuação preventiva"* — ou seja, o motor decidindo
evacuação sozinho. O FloodGuard não tem essa autoridade.

### 1. Ação operacional recomendada (Defesa Civil / operador)

Vem do motor, no campo `recommended_action` do contrato de API
(`risk_rules.RECOMMENDED_ACTIONS`). É instrução de plantão.

| Nível | Ação operacional |
|---|---|
| `seguro` | Manter o acompanhamento da região e das fontes oficiais. |
| `atencao` | Acompanhar a evolução das condições e manter a equipe atenta a novas atualizações. |
| `alerta` | Reforçar o monitoramento da área, verificar as informações disponíveis e preparar a comunicação preventiva à população. |
| `critico` | Priorizar a verificação da área e executar as medidas previstas no plano de contingência, conforme validação da Defesa Civil. |

Na UI o rótulo é sempre **"Ação operacional recomendada"** — nunca "Ação
recomendada" sozinha, que apaga o público-alvo.

### 2. Orientação à população (cidadão)

**Só no frontend**, em `apps/web/src/lib/alertMessaging.ts`
(`getPublicGuidance`). Não trafega por esta API nesta fase: é conteúdo
**demonstrativo do protótipo**, não um alerta oficial, e não valia inventar
contrato novo para uma camada ainda ilustrativa. Linguagem de cidadão, sem
score, confiança, HAND, pesos, fórmula ou payload.

| Nível | Orientação à população |
|---|---|
| `seguro` | Nenhum alerta ativo para esta região. Continue acompanhando os canais oficiais da Defesa Civil. |
| `atencao` | Condições exigem atenção na região. Acompanhe as atualizações da Defesa Civil e evite áreas com sinais de alagamento. |
| `alerta` | Atenção para condições de risco na região. Evite áreas alagadas, acompanhe as orientações da Defesa Civil e consulte os locais seguros próximos. |
| `critico` | Situação crítica na região. Siga as orientações da Defesa Civil, não atravesse áreas alagadas e, caso seja determinado o deslocamento, utilize o local seguro indicado. |

### Regra de autoridade

Nenhuma das duas camadas ordena evacuação, promete segurança ou substitui a
Defesa Civil. No nível crítico, o operacional aponta o plano de contingência
"conforme validação da Defesa Civil" e o texto ao cidadão trata o
deslocamento como condicional ("caso seja determinado"). Isso é testado em
`tests/test_alert_messaging.py` e em
`apps/web/src/lib/__tests__/alertMessaging.test.ts`.

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
  "recommended_action": "Priorizar a verificação da área e executar as medidas previstas no plano de contingência, conforme validação da Defesa Civil."
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
  "recommended_action": "Manter o acompanhamento da região e das fontes oficiais."
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

O `recommended_action` que viaja no payload é o texto **operacional** — não
é mensagem pronta para difusão à população. O `compact_payload`
(`FG|municipio|NIVEL|regiao`) transporta só identificação de nível e região,
sem texto de mensagem: **o protocolo não mudou** nesta revisão.

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
