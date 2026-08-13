# Limitações — FloodGuard

O FloodGuard, na fase atual, é uma **Prova de Conceito (PoC)** de caráter
acadêmico, experimental e demonstrativo. Estas limitações valem para todo o
sistema consolidado e devem ser mantidas visíveis na interface e na
documentação pública.

1. **Sensores simulados.** Não existem sensores físicos de nível d'água ou
   precipitação em operação. Toda telemetria é gerada por software.

2. **Sem integração obrigatória com hardware real.** A plataforma é
   hardware-agnóstica; não fabrica nem depende de nenhum dispositivo físico
   específico.

3. **Comunicação de campo simulada.** O comportamento de LoRaWAN e
   Meshtastic é representado por lógica de software (`implemented: false`
   nos payloads gerados). Não há transmissão de rádio real.

4. **Telemetria sintética.** Os dados usados podem ser sintéticos ou
   baseados em cenários controlados, não em medições de campo.

5. **HAND é suscetibilidade, não previsão.** O modelo HAND (Height Above
   Nearest Drainage) representa uma variável topográfica estática. Não
   incorpora exposição, vulnerabilidade, população ou infraestrutura, e não
   substitui modelos hidrodinâmicos completos.

6. **Motor de risco não validado operacionalmente.** A regra de cálculo de
   risco (F3, `services/api/app/engine/risk_engine.py`) é transparente e
   auditável — pesos fixos, fatores explicáveis, justificativa textual —
   mas é uma Prova de Conceito: os pesos (0.45/0.30/0.20/0.05) e as
   referências de normalização (150 mm de chuva, 3,0 m de nível d'água) são
   valores demonstrativos, **não calibrados com dados reais de campo nem
   validados contra eventos históricos de inundação**. A `confidence`
   retornada pelo motor também é demonstrativa, não uma medida estatística.
   Não deve ser usada isoladamente para decisão real de proteção civil —
   detalhes em [motor-de-risco.md](motor-de-risco.md).

7. **Não substitui a Defesa Civil.** Os resultados do sistema não devem ser
   utilizados como único instrumento para decisões reais de emergência.

8. **Piloto único.** A área de estudo atual é o município de Blumenau/SC. A
   cobertura de outros municípios é item de roadmap.

9. **Finalidade.** O sistema possui finalidade acadêmica, experimental e
   demonstrativa — não é um produto operacional em produção.

10. **Abrigos são demonstrativos.** A tela `/abrigos` (F6.2.1) exibe 3
    abrigos com capacidade, ocupação e status — todos **simulados e fixos no
    frontend** (`apps/web/src/pages/Shelters.tsx`). Não vêm do banco, não
    passam pela API e não representam abrigos ativos da Defesa Civil de
    Blumenau. O router `shelters.py` continua placeholder e a tabela
    `shelters` continua vazia; CRUD real é item da F7.

11. **Cobertura HAND maior que o município.** As zonas HAND cobrem a área
    hidrologicamente contribuinte (sub-bacias que drenam para a região), não
    apenas o polígono administrativo de Blumenau — por isso aparecem sobre
    municípios vizinhos no mapa. É intencional (recortar descartaria bacia
    relevante), está explicado na própria tela `/mapa` e em
    [mapa-diferencial-plano.md](mapa-diferencial-plano.md).

12. **PostGIS não validado em execução.** Todo o comportamento geoespacial
    verificado até aqui é o do **fallback estático**. Desde a F6.2.1 os
    endpoints que dependem do banco respondem `503` com mensagem acionável
    (em vez de `500`) e `GET /api/geo/status` reporta o estado real da
    conexão — mas o caminho `source: "postgis"` continua sem execução
    confirmada contra um banco populado.

13. **Mapa usa geometria simplificada no fallback.** Quando o PostGIS não
    está disponível (comum neste ambiente — F2.1), `/mapa` carrega
    `apps/web/public/geo/blumenau_hand_zones_simplified.geojson`, gerado com
    tolerância de simplificação alta (`simplify(0.0005,
    preserve_topology=False)`) para caber em poucos MB. Os limites de classe
    HAND ficam visualmente reconhecíveis, mas não são a geometria de precisão
    total — para análise fina, a fonte é o PostGIS populado ou os artefatos
    originais em `data/hand/`. Ver [metodologia-hand.md](metodologia-hand.md).
