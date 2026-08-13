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
  `urbanflood_urnn_demo`, mantido como repositório separado). Entrada
  opcional futura do motor de risco (F3,
  [motor-de-risco.md](motor-de-risco.md)): usar uma previsão de chuva de
  curto prazo (U-RNN) no lugar da chuva acumulada simples que alimenta
  `rainfall_factor` hoje — não substitui o fator, é uma fonte alternativa
  para o mesmo fator.
- Motor NDVI/NDBI/Tc completo do `techguard-sentinela` como alternativa mais
  sofisticada à fórmula simplificada da F3.
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

## Mapa — de fallback estático para PostGIS ao vivo

Desde a F6, `/mapa` já renderiza cartografia real (Leaflet) e nunca fica
vazio, mas a camada de zonas HAND normalmente vem do fallback estático
(`apps/web/public/geo/*.geojson`, gerado uma vez a partir de `data/hand/`)
porque o PostGIS local não está validado end-to-end (F2.1/F7). Quando F7
rodar `export_to_postgis.py export-all` contra um Postgres real, o mesmo
mapa passa a consumir `/api/geo/hand-zones` ao vivo automaticamente — não
precisa de mudança de código, só o banco populado (ver
`services/api/app/routers/geo.py::get_demo_map`, que já decide a fonte
sozinho).
