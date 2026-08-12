# Decisões de Arquitetura — FloodGuard

Este documento registra as decisões oficiais tomadas para a consolidação do
FloodGuard a partir dos repositórios anteriores do Americas TechGuard. Serve
como referência única para não reabrir discussões já fechadas durante a
implementação.

## Identidade do produto

FloodGuard é uma plataforma **GovTech B2G** (Business-to-Government) para
Defesas Civis municipais, com piloto em Blumenau/SC, focada em **apoio à
tomada de decisão** em eventos de alagamento e inundação. Não é um produto
B2C nem um sistema de resposta automática a emergências.

## Escopo obrigatório

- Software-only. Hardware-agnóstico.
- Não fabricar sensores, placas, sirenes ou dispositivos físicos.
- Dados IoT reais, LoRaWAN, Meshtastic e MQTT real são integrações futuras —
  hoje são simulados por software.
- A PoC atual usa simulação de telemetria, não sensores reais.
- O coração técnico da plataforma é o modelo **HAND** (Height Above Nearest
  Drainage).
- O banco espacial é **PostgreSQL/PostGIS**.
- O backend final é **FastAPI**.
- O frontend final é **React + Vite + TypeScript + Tailwind + Leaflet**.

## Usuário primário: operador da Defesa Civil

A PoC tem foco no **operador da Defesa Civil** como usuário primário. As 25
telas de cidadão descritas no Relatório Técnico original (perfil completo com
conta, histórico de alertas, edição de perfil etc.) **não** fazem parte do
MVP.

A visão do cidadão no MVP é mínima e não exige conta:

- consulta de alertas ativos;
- consulta de abrigos disponíveis;
- solicitação simples de ajuda.

O app completo do cidadão (Expo/React Native, cadastro de abrigos pelo
cidadão, alertas personalizados, chat, push notifications) fica no roadmap —
ver [roadmap.md](roadmap.md).

## Motor de risco canônico

Existiam dois motores de risco incompatíveis nos repositórios de origem:

| | `final_poc` | `techguard-sentinela` |
|---|---|---|
| Classes HAND | 4 classes (3/10/30 m) | 6 classes (2/5/10/20/50 m) |
| Fórmula | média ponderada fixa (flood/chuva/suscetibilidade) | chuva efetiva `P_ef = max(0, P − C_d)` com saturação antecedente e permeabilidade espectral (NDVI/NDBI) |
| Saída | 4 níveis (baixo/médio/alto/crítico) | 6 rótulos de suscetibilidade + risco |

**Decisão original:** o motor de risco canônico do FloodGuard seria o do
`techguard-sentinela` (`backend/engine/risk_engine.py`), por ser mais completo
e diretamente ancorado em HAND/NDVI/NDBI.

**O que foi de fato implementado na F3:** uma fórmula própria, mais simples e
explicável — não um port do motor NDVI/NDBI/Tc do `techguard-sentinela`:

```
score = 0.45*hand_risk_weight + 0.30*rainfall_factor + 0.20*water_level_factor + 0.05*trend_factor
```

O que o `techguard-sentinela` contribuiu de fato para a F3 foi o **padrão**
— fusão de contexto espacial HAND com variáveis dinâmicas, saída explicável
com justificativa textual — não o código NDVI/NDBI/saturação em si. Ver
[motor-de-risco.md](motor-de-risco.md) para a fórmula completa e
`services/api/app/engine/risk_engine.py` para os créditos no código.

Do `americas_techguard_final_poc` são aproveitados:

- a **classificação final em 4 níveis** (seguro/atenção/alerta/crítico);
- o **payload UniMesh/LoRa simulado**, com o campo `implemented: false`
  preservado (`services/api/app/engine/mesh_payload.py`, portado de
  `src/mesh_simulator.py`);
- a **referência de chuva de 150 mm** (`RAINFALL_REFERENCE_MM`) usada para
  normalizar o fator de chuva;
- os **textos de auditabilidade e transparência** dos docstrings originais
  (ex.: avisos de que a regra não é validada operacionalmente);
- a documentação legada como referência histórica.

Se o motor NDVI/NDBI/Tc completo do `techguard-sentinela` for incorporado no
futuro, este documento e `docs/motor-de-risco.md` devem ser atualizados
juntos — não é para a fórmula da F3 e a do sentinela ficarem descritas como
a mesma coisa em lugares diferentes.

## Pipeline geoespacial HAND

Fonte principal: repositório `HAND` (notebook
`hand_whitebox_integrado_ANA_IBGE_BLUMENAU.ipynb` e artefatos em
`outputs/blumenau/`: `blumenau_hand.tif`, `blumenau_hand_classes.tif`,
`blumenau_boundary.gpkg`, `ottobacias_blumenau_union.gpkg`).

Este pipeline é a fonte de verdade dos dados HAND de Blumenau. Os artefatos
leves (`.gpkg`, PNGs, classes) entram no repositório consolidado; dados
brutos pesados (`data/raw/`, DEMs intermediários) não são versionados — ver
[.gitignore](../.gitignore).

## Fora do MVP

- `urbanflood_urnn_demo` (nowcasting U-RNN) — fica fora do MVP, entra apenas
  como evolução futura de roadmap.
- `Americas-TechGuard-Plataforma-para-Monitoramento-e-apoio-a-Inundacoes-PoC-`
  — repositório de terceiro sem conteúdo além de README/LICENSE, não entra na
  consolidação.

## Estratégia de repositório

- FloodGuard passa a ser a raiz única do projeto consolidado.
- Sem submódulos git — código dos repositórios de origem é copiado
  (não referenciado) para dentro da estrutura do FloodGuard.
- Nenhum arquivo das pastas de origem é apagado durante a consolidação.

## Autoria

FloodGuard é trabalho de equipe (João Benvenutti, Nyrx Oliveira, Pedro
Zanette). Reaproveitamento do `techguard-sentinela` está autorizado sob
acordo de equipe. Ver [autoria-licenca.md](autoria-licenca.md) para os
termos completos e créditos por componente.
