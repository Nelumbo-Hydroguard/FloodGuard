# engine/

Motor de risco explicável do FloodGuard, implementado na F3.

**Status: implementado.** Fórmula própria e simplificada (0.45 HAND + 0.30
chuva + 0.20 nível d'água + 0.05 tendência) — não é um port do motor
NDVI/NDBI/Tc do `techguard-sentinela`, mas herda dele o padrão de fusão
espacial + risco explicável, sob acordo de equipe (João Benvenutti, Nyrx
Oliveira, Pedro Zanette — ver
[docs/autoria-licenca.md](../../../../docs/autoria-licenca.md)). Histórico
completo da decisão em
[docs/decisoes-arquitetura.md](../../../../docs/decisoes-arquitetura.md#motor-de-risco-canônico).

Fórmula, fatores, fallback, exemplos e limitações:
[docs/motor-de-risco.md](../../../../docs/motor-de-risco.md).

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `risk_rules.py` | Pesos, referências de normalização, limiares de classificação, ações recomendadas — funções puras, sem I/O |
| `risk_engine.py` | Orquestra: resolve contexto espacial, calcula fatores e score, monta a resposta |
| `risk_explanation.py` | Justificativa textual a partir dos fatores |
| `spatial_context.py` | Contexto HAND mockado (sem banco) — as 4 classes reais de Blumenau + lookup por região |
| `telemetry_normalizer.py` | Normaliza payload bruto de telemetria simulada (aliases de campo, clamp, timestamp) |
| `mesh_payload.py` | Payload UniMesh/LoRa simulado — `implemented: false` sempre |

## Sem dependência de banco

Nenhum destes módulos abre conexão com PostGIS. Contexto HAND vem do
payload (`hand_class_id`/`hand_risk_weight`) ou de `spatial_context.py`
(mock por região). Isso permitiu a F3 avançar mesmo com a F2.1 (validação
PostGIS end-to-end) bloqueada por falta de acesso a Docker local — ver
testes em `services/api/tests/`.
