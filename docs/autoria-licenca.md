# Autoria e Licenciamento — FloodGuard

Este documento rastreia a origem e autoria do código reaproveitado na
consolidação do FloodGuard.

## Autoria coletiva (acordo de equipe)

João Benvenutti, Nyrx Oliveira e Pedro Zanette concordaram em consolidar os
códigos e componentes desenvolvidos anteriormente por cada um em um
repositório único do FloodGuard, tratado como trabalho de equipe. Condições
do acordo:

1. Autoria coletiva registrada no README principal (feito — ver seção
   "Autoria" do [README.md](../README.md)).
2. O repositório final é criado dentro de uma organização/time do GitHub —
   **pendente**: nenhum repositório de organização foi criado ainda; o
   consolidado hoje vive só localmente. Decisão de nome da organização e
   criação do repo cabem à equipe, não a este agente.
3. Componentes reaproveitados de cada origem são documentados (este arquivo
   + docs/decisoes-arquitetura.md).
4. Créditos individuais não são removidos quando relevante — cada seção
   abaixo mantém o autor original do repositório de origem, mesmo sob
   autoria coletiva do consolidado.

## techguard-sentinela

- **Repositório de origem:** `Joaopbcardoso/techguard-sentinela`
  (github.com/Joaopbcardoso/techguard-sentinela)
- **Autor:** João Benvenutti (P. B. Cardoso)
- **Conteúdo reaproveitado:** motor de risco (HAND/NDVI/NDBI, chuva efetiva,
  saturação hidrológica), API FastAPI, camada de triagem de crise, gestão de
  abrigos, simulador de sensores, bridge MQTT, frontend React (mapa
  interativo, painel de comando, timeline de alertas).
- **Status de autorização:** **AUTORIZADO**, sob o acordo de equipe acima.
  Código pode ser copiado para `services/api/` e `apps/web/` a partir de
  agora — condicionado ao repositório de organização (item 2 do acordo) e
  aos créditos abaixo.
- **Crédito:** ao ser incorporado, o README principal e o cabeçalho dos
  arquivos relevantes devem creditar a autoria original de João Benvenutti.

## americas_techguard_final_poc

- **Repositório de origem:** `PedroZanette/americas-techguard-final-poc`
- **Autor:** Pedro Henrique Nunes Zanette (autor deste consolidado)
- **Conteúdo reaproveitado:** classificação de risco em 4 níveis, payload
  UniMesh/LoRa simulado, textos de auditabilidade/transparência,
  documentação legada.
- **Status de autorização:** autorizado (autoria própria).

## HAND

- **Repositório de origem:** `PedroZanette/Hand`
- **Autor:** Pedro Henrique Nunes Zanette (autor deste consolidado)
- **Conteúdo reaproveitado:** notebook e pipeline HAND, artefatos
  geoespaciais de Blumenau.
- **Status de autorização:** autorizado (autoria própria).

## urbanflood_urnn_demo

- **Repositório de origem:** `PedroZanette/urbanflood_urnn_demo`
- **Autor:** Pedro Henrique Nunes Zanette (autor deste consolidado)
- **Status:** fora do MVP. Fica como repositório separado, referenciado
  apenas no roadmap.

## Americas-TechGuard-Plataforma-para-Monitoramento-e-apoio-a-Inundacoes-PoC-

- **Repositório de origem:** `NyrxScar/Americas-TechGuard-Plataforma-para-Monitoramento-e-apoio-a-Inundacoes-PoC-`
- **Autor:** Nyrx Oliveira — parte do acordo de equipe acima, mas este
  repositório específico não tem código (só README e LICENSE).
- **Conteúdo:** apenas README e LICENSE, sem código.
- **Status:** não incorporado à consolidação — nada a reaproveitar aqui.
