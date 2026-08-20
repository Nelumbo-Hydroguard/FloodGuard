import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import {
  fetchDemoAlerts,
  fetchDemoMap,
  fetchDemoShelters,
  fetchHandZonesGeoJSON,
  fetchMunicipalityBlumenau,
  fetchStaticGeoJSON,
  type DemoAlert,
  type DemoMapResponse,
  type DemoShelter,
  type RiskLevel,
} from "../lib/api";
import { RISK_THEME, type RiskTheme } from "../lib/riskTheme";
import { PageHeader } from "../components/PageHeader";
import { MapLegend } from "../components/MapLegend";
import { MapAlertRail } from "../components/MapAlertRail";
import { ErrorState } from "../components/ErrorState";
import { AlertMapPopup } from "../components/AlertMapPopup";

const BLUMENAU_CENTER: [number, number] = [-26.9194, -49.0661];

// Ordem alta -> muito baixa suscetibilidade mapeada 1:1 nas 4 cores de
// risco da UI (mesma ordem: crítico/alerta/atenção/seguro) — pedido
// explícito da F6 ("classe baixa/segura; atenção; alerta; crítico/suscetível").
const SUSCEPTIBILITY_TO_RISK: Record<string, RiskLevel> = {
  alta: "critico",
  media: "alerta",
  baixa: "atencao",
  muito_baixa: "seguro",
};

function themeForSusceptibility(susceptibility: string): RiskTheme {
  const level = SUSCEPTIBILITY_TO_RISK[susceptibility] ?? "atencao";
  return RISK_THEME[level];
}

// Marcador de alerta simulado. Nível "crítico" ganha um anel pulsante
// (Tailwind `animate-ping`) — ideia inspirada no destaque visual de estado
// crítico do projeto de referência TechGuard Sentinela (João Benvenutti,
// ver docs/auditoria-mapa-benvenutti-f9-1.md), reimplementada aqui só com
// CSS/Tailwind já disponíveis no projeto, sem nova dependência.
function alertIcon(theme: RiskTheme, level: RiskLevel) {
  const pulse =
    level === "critico"
      ? `<div class="animate-ping" style="position:absolute;inset:-6px;border-radius:9999px;background:${theme.hex};opacity:0.45;"></div>`
      : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:16px;height:16px;">${pulse}<div style="position:relative;width:16px;height:16px;border-radius:9999px;background:${theme.hex};border:2px solid #040b14;box-shadow:0 0 0 2px ${theme.hex}55, 0 0 12px ${theme.hex}99;"></div></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Ícone quadrado (não círculo) pra abrigo nunca ser confundido visualmente
// com um ponto de cenário de risco — são camadas de natureza diferente.
function shelterIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:#22d3ee;border:2px solid #040b14;transform:rotate(45deg);box-shadow:0 0 10px rgba(34,211,238,0.5);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/**
 * Foca (voa até) e abre o popup do alerta indicado por `?alert=<id>` na URL
 * (F9.1) — usado pelos links "Ver no mapa" de /alertas e /alertas/:id, e
 * pela trilha lateral de alertas (F10).
 * Precisa estar dentro de <MapContainer> pra ter acesso ao `useMap()`.
 */
function MapAlertFocus({
  alerts,
  focusId,
  markerRefs,
}: {
  alerts: DemoAlert[] | null;
  focusId: string | null;
  markerRefs: MutableRefObject<Record<string, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusId || !alerts) return;
    const alert = alerts.find((a) => a.id === focusId);
    if (!alert) return;

    map.flyTo([alert.latitude, alert.longitude], 13, { duration: 0.8 });

    // Abrir no `moveend`, não num setTimeout menor que a animação: abrindo
    // durante o voo, o autoPan do Leaflet calculava a posição contra um
    // enquadramento intermediário e o popup terminava cortado pelo topo do
    // mapa (achado na validação visual da F10).
    const openPopup = () => markerRefs.current[alert.id]?.openPopup();
    map.once("moveend", openPopup);
    return () => {
      map.off("moveend", openPopup);
    };
  }, [focusId, alerts, map, markerRefs]);

  return null;
}

export function RiskMap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusAlertId = searchParams.get("alert");

  const [demoMap, setDemoMap] = useState<DemoMapResponse | null>(null);
  const [alerts, setAlerts] = useState<DemoAlert[] | null>(null);
  const [shelters, setShelters] = useState<DemoShelter[] | null>(null);
  const [boundary, setBoundary] = useState<GeoJsonObject | null>(null);
  const [handZones, setHandZones] = useState<GeoJsonObject | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const alertMarkerRefs = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    fetchDemoMap()
      .then(setDemoMap)
      .catch(() => setGeoError("Não foi possível falar com a API. O backend está rodando?"));

    // Alertas simulados (F9.1) — mesma fonte de /alertas, com lat/lon
    // próprios (services/api/app/routers/alerts.py::_build_alert). Se
    // falhar, é a API inteira fora do ar, já coberto pelo erro acima.
    fetchDemoAlerts()
      .then((data) => setAlerts(data.alerts))
      .catch(() => {});

    // Camada opcional de abrigos (F7) — busca independente das camadas
    // geoespaciais acima; se falhar, o mapa continua funcionando sem os
    // marcadores de abrigo, não derruba boundary/hand-zones/alertas.
    fetchDemoShelters()
      .then((data) => setShelters(data.shelters))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!demoMap) return;

    async function loadGeometry() {
      try {
        if (demoMap!.source === "postgis") {
          const [boundaryFeature, zonesCollection] = await Promise.all([
            fetchMunicipalityBlumenau(),
            fetchHandZonesGeoJSON(),
          ]);
          setBoundary(boundaryFeature as GeoJsonObject);
          setHandZones(zonesCollection as GeoJsonObject);
          return;
        }
        throw new Error("usando fallback estático");
      } catch {
        // PostGIS indisponível (ou demoMap já veio em static_fallback) —
        // cai pros arquivos estáticos gerados por
        // services/geo/scripts/generate_web_geojson.py, servidos como
        // arquivo puro pelo Vite (apps/web/public/geo/).
        try {
          const [boundaryGeo, zonesGeo] = await Promise.all([
            fetchStaticGeoJSON("blumenau_boundary.geojson"),
            fetchStaticGeoJSON("blumenau_hand_zones_simplified.geojson"),
          ]);
          setBoundary(boundaryGeo as GeoJsonObject);
          setHandZones(zonesGeo as GeoJsonObject);
        } catch (staticErr) {
          setGeoError(staticErr instanceof Error ? staticErr.message : "Falha ao carregar camadas estáticas do mapa.");
        }
      }
    }

    loadGeometry();
  }, [demoMap]);

  if (geoError) {
    return (
      <div className="mx-auto w-full max-w-7xl p-6">
        <PageHeader eyebrow="Blumenau/SC" title="Mapa de risco" />
        <ErrorState message={geoError} />
      </div>
    );
  }

  const usingFallback = demoMap?.source === "static_fallback";
  const layersReady = Boolean(boundary || handZones);

  return (
    <>
      {/* O mapa ocupa a viewport inteira abaixo do header (h-14 = 3.5rem em
          Layout.tsx). É a tela de operação: só situação, alertas, legenda,
          controles e ações. Metodologia (HAND, recorte das bacias, origem
          dos marcadores) vive em /sobre — F11. */}
      <section className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        <MapContainer
          center={BLUMENAU_CENTER}
          zoom={11}
          zoomControl={false}
          style={{ height: "100%", width: "100%", background: "#081726" }}
        >
          {/* Basemap escuro (CARTO dark_all): o tile padrão do OSM é claro e,
              dentro do shell navy, roubava toda a atenção das camadas HAND —
              as cores de risco perdiam contraste sobre ruas brancas. Mesma
              biblioteca, só troca de URL de tile. */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Zoom movido pro canto inferior direito: no topo-esquerdo ele
              ficava embaixo do painel de título do HUD. */}
          <ZoomControl position="bottomright" />

          {handZones && (
            <GeoJSON
              key="hand-zones"
              data={handZones}
              style={(feature) => {
                const susceptibility = feature?.properties?.susceptibility ?? "";
                const theme = themeForSusceptibility(susceptibility);
                // Traço fino e translúcido: com weight 1 opaco, o contorno de
                // cada polígono dominava a leitura em zoom alto e a mancha de
                // suscetibilidade sumia sob a malha de bordas. O preenchimento
                // (o dado que importa) é o mesmo.
                return {
                  color: theme.hex,
                  weight: 0.5,
                  opacity: 0.35,
                  fillColor: theme.hex,
                  fillOpacity: 0.35,
                };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties ?? {};
                layer.bindPopup(
                  `<strong>${p.class_label ?? "Zona HAND"}</strong><br/>` +
                    `Suscetibilidade: ${p.susceptibility ?? "—"}<br/>` +
                    `${p.percent_area != null ? `${p.percent_area}% da área do município<br/>` : ""}` +
                    `<em>Peso no motor: ${p.risk_weight ?? "—"}</em>`,
                );
              }}
            />
          )}

          {/* Limite municipal desenhado em duas passadas: um halo escuro
              embaixo e a linha ciano em cima. Sem o halo, o contorno some
              sobre o preenchimento colorido das zonas HAND (achado da
              auditoria F6.2 — o limite renderizava, mas era invisível). */}
          {boundary && (
            <GeoJSON
              key="boundary-halo"
              data={boundary}
              style={{ color: "#040b14", weight: 7, fillOpacity: 0, opacity: 0.85 }}
            />
          )}
          {boundary && (
            <GeoJSON
              key="boundary"
              data={boundary}
              style={{ color: "#22d3ee", weight: 3, fillOpacity: 0 }}
            />
          )}

          {alerts?.map((alert) => (
            <Marker
              key={alert.id}
              position={[alert.latitude, alert.longitude]}
              icon={alertIcon(RISK_THEME[alert.risk_level], alert.risk_level)}
              ref={(instance) => {
                if (instance) alertMarkerRefs.current[alert.id] = instance;
                else delete alertMarkerRefs.current[alert.id];
              }}
            >
              {/* Padding do autoPan reserva o espaço dos painéis do HUD
                  (título à esquerda, trilha à direita) pra o popup nunca
                  abrir por baixo deles. */}
              <Popup autoPanPaddingTopLeft={[372, 32]} autoPanPaddingBottomRight={[332, 32]}>
                <AlertMapPopup alert={alert} />
              </Popup>
            </Marker>
          ))}

          <MapAlertFocus alerts={alerts} focusId={focusAlertId} markerRefs={alertMarkerRefs} />

          {shelters?.map((shelter) => (
            <Marker key={shelter.id} position={[shelter.latitude, shelter.longitude]} icon={shelterIcon()}>
              <Popup>
                <div className="min-w-[200px]">
                  <strong className="text-[13px] font-semibold text-white">{shelter.name}</strong>
                  <p className="mt-1 text-[11px] text-slate-500">{shelter.region}</p>
                  <p className="mt-2 font-mono text-sm text-slate-200">
                    {shelter.capacity_used}/{shelter.capacity_total}{" "}
                    <span className="text-slate-500">({shelter.occupancy_percent}%)</span>
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{shelter.notes}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* ── HUD ───────────────────────────────────────────────────────── */}

        <div className="panel-glass absolute left-6 top-6 z-[1000] max-w-[340px] animate-rise-in p-4">
          <p className="data-label text-accent/80">Blumenau/SC</p>
          <h1 className="mt-1.5 font-display text-xl font-bold leading-tight text-white">
            Mapa de risco
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Suscetibilidade do terreno, alertas e abrigos.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-navy-700/70 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
              <span className="h-1 w-1 animate-breathe rounded-full bg-accent" />
              dados simulados
            </span>
            {usingFallback && (
              <span className="rounded-full border border-navy-600 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                fallback estático
              </span>
            )}
          </div>

          {!layersReady && (
            <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-accent" />
              Carregando camadas…
            </p>
          )}
        </div>

        <MapAlertRail
          alerts={alerts}
          activeId={focusAlertId}
          onSelect={(id) => setSearchParams({ alert: id })}
        />

        <MapLegend />
      </section>
    </>
  );
}
