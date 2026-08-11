# services/simulator

Simulador de telemetria do FloodGuard — gera leituras sintéticas de nível
d'água e chuva para alimentar o motor de risco e a demonstração da PoC.

**Status: placeholder (F1).** Nenhum gerador está implementado ainda.
`simulated_payload_example.json` mostra o formato de payload esperado.

## Princípios

- Todo dado gerado aqui é sintético — `"source": "simulation"`.
- Nenhuma integração com hardware, LoRaWAN, Meshtastic ou MQTT real.
- `"hardware_implemented": false` em todo payload, sempre.

## Próximos passos (F3+)

- Implementar gerador de cenários (chuva, região, horizonte) — inspirado em
  `americas_techguard_final_poc/src/demo_scenarios.py`.
- Conectar ao router `services/api/app/routers/telemetry.py` da API.
