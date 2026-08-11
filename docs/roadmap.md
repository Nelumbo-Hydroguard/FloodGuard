# Roadmap — FloodGuard

Itens desta lista **não** fazem parte do MVP/PoC atual. Estão documentados
aqui para deixar claro o que é evolução futura versus o que é entregue agora.
Nenhum destes itens deve ser implementado sem decisão explícita de escopo.

## App completo do cidadão

- Aplicativo mobile completo em Expo/React Native (as ~25 telas descritas no
  Relatório Técnico original: conta, login, histórico de alertas, edição de
  perfil, configurações, cadastro de abrigo pelo cidadão etc.).
- Alertas personalizados por localização/perfil.
- Chat com a Defesa Civil.
- Notificações push.

No MVP, o cidadão tem acesso mínimo e sem conta: consulta de alertas,
consulta de abrigos e solicitação simples de ajuda.

## Hardware e telemetria real

- Sensores físicos de nível d'água e precipitação.
- Integração com LoRaWAN real (gateways físicos).
- Integração com Meshtastic real (rede mesh de rádio).
- Broker MQTT real conectado a hardware de campo.

Hoje: toda a telemetria é simulada por software; o payload UniMesh/LoRa é
gerado com `implemented: false`, sem transmissão física.

## Modelagem e dados ambientais

- Serviços de nowcasting de curto prazo (evolução do trabalho em
  `urbanflood_urnn_demo`, mantido como repositório separado).
- Novas fontes de dados ambientais (além de Sentinel-2/Copernicus DEM).
- Modelos hidrodinâmicos completos além do proxy topográfico HAND.

## Operação e escala

- Expansão para múltiplos municípios além de Blumenau/SC.
- Serviço de notificações push multicanal.
- Gestão operacional pós-evento (relatórios de prestação de contas, rotas de
  evacuação, equipes de resgate).

## Infraestrutura

- Ingestão de dados reais via broker MQTT dedicado.
- Armazenamento de telemetria histórica em escala (fora do escopo da PoC).
