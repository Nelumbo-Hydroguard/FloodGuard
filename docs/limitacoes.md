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
   risco é transparente e auditável, mas não foi calibrada com dados reais
   de campo e não deve ser usada isoladamente para decisão real de proteção
   civil.

7. **Não substitui a Defesa Civil.** Os resultados do sistema não devem ser
   utilizados como único instrumento para decisões reais de emergência.

8. **Piloto único.** A área de estudo atual é o município de Blumenau/SC. A
   cobertura de outros municípios é item de roadmap.

9. **Finalidade.** O sistema possui finalidade acadêmica, experimental e
   demonstrativa — não é um produto operacional em produção.
