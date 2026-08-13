import { useEffect, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import {
  fetchDemoMap,
  fetchDemoPoints,
  fetchHandZonesGeoJSON,
  fetchMunicipalityBlumenau,
  fetchStaticGeoJSON,
  type DemoMapResponse,
  type DemoPoint,
} from "../lib/api";
import { RISK_THEME, type RiskTheme } from "../lib/riskTheme";
import type { RiskLevel } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { DemoNotice } from "../components/DemoNotice";
import { MapLegend } from "../components/MapLegend";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

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

function pointIcon(theme: RiskTheme) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${theme.hex};border:2px solid #040b14;box-shadow:0 0 0 2px ${theme.hex}55;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function RiskMap() {
  const [demoMap, setDemoMap] = useState<DemoMapResponse | null>(null);
  const [points, setPoints] = useState<DemoPoint[] | null>(null);
  const [boundary, setBoundary] = useState<GeoJsonObject | null>(null);
  const [handZones, setHandZones] = useState<GeoJsonObject | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    fetchDemoMap()
      .then(setDemoMap)
      .catch(() => setGeoError("Não foi possível falar com a API. O backend está rodando?"));

    fetchDemoPoints()
      .then((data) => setPoints(data.points))
      .catch(() => {
        // demo-points não depende de banco — se isso falhar, é a API
        // inteira fora do ar, já coberto pelo erro de fetchDemoMap acima.
      });
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
          Marcadores de cenário são simulados (mesmos 3 de <code className="text-slate-400">/api/scenarios/demo</code>).
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

          {points?.map((point) => (
            <Marker key={point.id} position={[point.lat, point.lon]} icon={pointIcon(RISK_THEME[point.risk_level])}>
              <Popup>
                <strong>{point.name}</strong>
                <br />
                Risco: {RISK_THEME[point.risk_level].label} ({Math.round(point.risk_score * 100)}%)
                <br />
                <span style={{ fontSize: "0.85em" }}>{point.explanation}</span>
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
    </div>
  );
}
