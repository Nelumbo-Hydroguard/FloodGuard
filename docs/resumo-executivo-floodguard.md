# Resumo Executivo — FloodGuard

**Problema.** Defesas Civis municipais decidem em eventos de alagamento com
dados fragmentados — suscetibilidade do terreno, chuva, nível de rio — sem
cruzamento automático, o que atrasa e dificulta a priorização sob pressão
de tempo.

**Solução.** FloodGuard é uma Prova de Conceito (PoC) GovTech B2G que cruza
suscetibilidade topográfica real (modelo HAND, processado sobre dados
públicos de Blumenau/SC), telemetria simulada de chuva e nível d'água, e um
motor de risco explicável — toda avaliação sai com score, nível, fatores,
justificativa textual e ação recomendada. O sistema é **software-only e
hardware-agnóstico**: nenhum sensor físico, rádio LoRa, Meshtastic ou MQTT
está em operação real.

**Diferencial.** O mapa comunica suscetibilidade espacial de forma direta —
4 zonas HAND coloridas sobre a área real de Blumenau, com marcadores de
cenários e abrigos, funcionando mesmo sem PostGIS (fallback geoespacial
estático gerado dos mesmos dados). O motor nunca finge certeza que não tem:
sem contexto HAND, reduz a própria confiança e avisa isso na explicação.

**Arquitetura.** Backend FastAPI (Python), motor de risco sem dependência
obrigatória de banco, PostgreSQL/PostGIS (schema pronto). Frontend
React 19 + Vite + TypeScript + Tailwind + Leaflet, 8 telas navegáveis
(landing, painel, mapa, telemetria, alertas, detalhe de alerta, abrigos,
sobre) mais 404 amigável. Autoria coletiva — Pedro Zanette, João
Benvenutti, Nyrx Oliveira.

**Estado atual (F8, main).** Motor de risco, dados HAND reais, mapa com
fallback, telemetria, alertas e abrigos simulados via API — todos
implementados e navegáveis. Alertas e abrigos sem persistência: recalculados
ou fixos em memória a cada chamada, por decisão de escopo da PoC.

**Validação.** **62 de 62 testes automatizados de backend passando**
(motor de risco, telemetria, payload simulado, geo, alertas, abrigos —
nenhum exige PostgreSQL). Build de frontend limpo. Fallback estático do
mapa confirmado ativo neste ambiente, já que PostGIS local segue
indisponível.

**Limitações.** Motor com pesos demonstrativos, não calibrados com dado
histórico real. PostGIS preparado, mas não validado ponta a ponta neste
ambiente — não é obrigatório para a demo, que roda inteira via fallback.
Sem autenticação, sem persistência real de alertas/abrigos, sem vínculo
confirmado entre abrigos simulados e instituição real. DEM (~30 m) não
captura microtopografia urbana. Nenhuma tela ou resposta de API afirma
sensor, transmissão, alerta oficial ou abrigo reais.

**Próximos passos.** Validar PostGIS ponta a ponta; persistir
alertas/abrigos; autenticação; calibração do motor com dado histórico;
nowcasting (U-RNN) como entrada futura de chuva; deploy. Detalhes em
`docs/roadmap.md`.
