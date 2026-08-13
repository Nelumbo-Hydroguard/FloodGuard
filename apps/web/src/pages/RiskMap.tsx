import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
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
import { SectionCard } from "../components/SectionCard";
import { DemoNotice } from "../components/DemoNotice";
import { MapLegend } from "../components/MapLegend";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
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
    html: `<div style="position:relative;width:16px;height:16px;">${pulse}<div style="position:relative;width:16px;height:16px;border-radius:9999px;background:${theme.hex};border:2px solid #040b14;box-shadow:0 0 0 2px ${theme.hex}55;"></div></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Ícone quadrado (não círculo) pra abrigo nunca ser confundido visualmente
// com um ponto de cenário de risco — são camadas de natureza diferente.
function shelterIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:#22d3ee;border:2px solid #040b14;transform:rotate(45deg);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/**
 * Foca (voa até) e abre o popup do alerta indicado por `?alert=<id>` na URL
 * (F9.1) — usado pelos links "Ver no mapa" de /alertas e /alertas/:id.
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
    const timer = setTimeout(() => {
      markerRefs.current[alert.id]?.openPopup();
    }, 500);
    return () => clearTimeout(timer);
  }, [focusId, alerts, map, markerRefs]);

  return null;
}

export function RiskMap() {
  const [searchParams] = useSearchParams();
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
      <div>
        <PageHeader title="Mapa de risco" description="Blumenau/SC — camadas HAND e cenários simulados." />
        <ErrorState message={geoError} />
      </div>
    );
  }

  const usingFallback = demoMap?.source === "static_fallback";

  return (
    <div>
      <PageHeader
        title="Mapa de risco"
        description="Limite municipal, zonas de suscetibilidade HAND e cenários simulados — Blumenau/SC."
      />

      <div className="mb-4">
        <DemoNotice>
          Marcadores de alerta são eventos simulados de demonstração (mesmos 3 de{" "}
          <Link to="/alertas" className="text-accent underline underline-offset-2">
            /alertas
          </Link>
          ) — não são alertas oficiais emitidos pela Defesa Civil. O mapa apoia a
          decisão, não a substitui.
          {usingFallback && (
            <>
              {" "}Camadas HAND servidas por arquivo estático — PostGIS
              indisponível neste ambiente (ver{" "}
              <code className="text-slate-400">docs/metodologia-hand.md</code>).
            </>
          )}
        </DemoNotice>
      </div>

      {demoMap && usingFallback && (
        <p className="text-xs text-slate-600 mb-3 font-mono">
          [fallback estático] {demoMap.message}
        </p>
      )}

      {!boundary && !handZones && !geoError && (
        <div className="mb-4">
          <EmptyState title="Carregando camadas geoespaciais…" />
        </div>
      )}

      <div className="relative h-[560px] w-full rounded overflow-hidden border border-navy-700">
        <MapContainer center={BLUMENAU_CENTER} zoom={11} style={{ height: "100%", width: "100%", background: "#081726" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {handZones && (
            <GeoJSON
              key="hand-zones"
              data={handZones}
              style={(feature) => {
                const susceptibility = feature?.properties?.susceptibility ?? "";
                const theme = themeForSusceptibility(susceptibility);
                return { color: theme.hex, weight: 1, fillColor: theme.hex, fillOpacity: 0.35 };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties ?? {};
                layer.bindPopup(
                  `<strong>${p.class_label ?? "Zona HAND"}</strong><br/>` +
                    `Suscetibilidade: ${p.susceptibility ?? "—"}<br/>` +
                    `${p.percent_area != null ? `${p.percent_area}% da área do município<br/>` : ""}` +
                    `<em>Peso no motor de risco: ${p.risk_weight ?? "—"}</em>`,
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
              <Popup>
                <AlertMapPopup alert={alert} />
              </Popup>
            </Marker>
          ))}

          <MapAlertFocus alerts={alerts} focusId={focusAlertId} markerRefs={alertMarkerRefs} />

          {shelters?.map((shelter) => (
            <Marker key={shelter.id} position={[shelter.latitude, shelter.longitude]} icon={shelterIcon()}>
              <Popup>
                <strong>{shelter.name}</strong> <em style={{ fontSize: "0.8em" }}>(simulado)</em>
                <br />
                Ocupação: {shelter.capacity_used}/{shelter.capacity_total} ({shelter.occupancy_percent}%)
                <br />
                <span style={{ fontSize: "0.85em" }}>{shelter.notes}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <MapLegend />
      </div>

      <SectionCard title="Por que as zonas HAND ultrapassam o limite de Blumenau" className="mt-4">
        <p className="text-sm text-slate-400">
          As zonas HAND podem ultrapassar o limite municipal porque representam
          a <strong className="text-slate-200">área hidrologicamente contribuinte</strong> usada
          no processamento, não apenas o polígono administrativo de Blumenau.
          Água não respeita divisa de município: o HAND foi calculado sobre as
          sub-bacias que drenam para a região, então parte das zonas coloridas
          cai sobre municípios vizinhos. O contorno em{" "}
          <span className="text-accent font-semibold">ciano</span> marca o limite
          municipal de Blumenau — os dados não foram recortados por ele de
          propósito, para não descartar a bacia que de fato influencia o
          território. Detalhes:{" "}
          <code className="text-slate-500">docs/hand-processamento-detalhado.md</code>.
        </p>
      </SectionCard>

      <SectionCard title="O que é HAND" className="mt-4">
        <p className="text-sm text-slate-400">
          HAND (Height Above Nearest Drainage) mede a altura de um ponto em
          relação à drenagem mais próxima — quanto menor, maior a
          suscetibilidade a alagamento. É uma variável topográfica estática:
          não incorpora chuva, vazão ou exposição por si só. As cores acima
          usam a mesma escala de risco do resto da plataforma (verde =
          seguro, vermelho = crítico) aplicada à suscetibilidade de cada
          zona. Detalhes: <code className="text-slate-500">docs/metodologia-hand.md</code>.
        </p>
      </SectionCard>

      <SectionCard title="Abrigos simulados" className="mt-4">
        <p className="text-sm text-slate-400">
          Os marcadores <span className="inline-block h-2.5 w-2.5 bg-accent align-middle" style={{ transform: "rotate(45deg)" }} />{" "}
          (losango ciano) no mapa são abrigos simulados — mesma fonte de{" "}
          <Link to="/abrigos" className="text-accent underline underline-offset-2">
            /abrigos
          </Link>
          , sem persistência em banco. Clique num marcador para ver ocupação
          e status, ou acesse a lista completa com filtros na página de
          Abrigos.
        </p>
      </SectionCard>
    </div>
  );
}
