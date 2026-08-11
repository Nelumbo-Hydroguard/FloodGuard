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

**Decisão:** o motor de risco canônico do FloodGuard é o do
`techguard-sentinela` (`backend/engine/risk_engine.py`), por ser mais completo
e diretamente ancorado em HAND/NDVI/NDBI.

Do `americas_techguard_final_poc` são aproveitados apenas:

- a **classificação final em 4 níveis** (baixo/médio/alto/crítico), aplicada
  como camada de apresentação sobre o resultado do motor canônico;
- o **payload UniMesh/LoRa simulado**, com o campo `implemented: false`
  preservado;
- os **textos de auditabilidade e transparência** dos docstrings originais
  (ex.: avisos de que a regra não é validada operacionalmente);
- a documentação legada como referência histórica.

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

Código reaproveitado do `techguard-sentinela` tem autor terceiro (João).
Ver [autoria-licenca.md](autoria-licenca.md) — pendente de autorização antes
de mover esse código para dentro do FloodGuard.
