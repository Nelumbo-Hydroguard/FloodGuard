# engine/

Este diretório vai receber o motor de risco canônico do FloodGuard.

Decisão registrada em
[docs/decisoes-arquitetura.md](../../../../docs/decisoes-arquitetura.md): o
motor de risco canônico é baseado no `techguard-sentinela` (HAND + NDVI +
NDBI + chuva efetiva + saturação hidrológica).

**Status: autorizado, código ainda não movido.** Autoria do
`techguard-sentinela` é de João Benvenutti; sob acordo de equipe (João
Benvenutti, Nyrx Oliveira, Pedro Zanette), reaproveitamento está liberado —
ver [docs/autoria-licenca.md](../../../../docs/autoria-licenca.md). A cópia
efetiva do código para cá é trabalho de fase separada (F3), condicionado
também à criação do repositório de organização (item 2 do acordo).

Quando movido, este diretório recebe:

- `risk_engine.py` — HAND, NDVI, NDBI, saturação, chuva efetiva, Tc.
- Classificação final em 4 níveis (herdada do `americas_techguard_final_poc`).
- Payload UniMesh/LoRa simulado (`implemented: false`).
