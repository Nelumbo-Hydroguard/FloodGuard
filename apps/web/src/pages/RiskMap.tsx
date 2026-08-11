import { useEffect, useState } from "react";
import { fetchGeoStatus, fetchHandZonesSummary, type HandZoneSummary } from "../lib/api";

export function RiskMap() {
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [classes, setClasses] = useState<HandZoneSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGeoStatus()
      .then((data) => setGeoStatus(data.note))
      .catch(() => setError("Não foi possível falar com a API. O backend está rodando?"));

    fetchHandZonesSummary()
      .then((data) => setClasses(data.classes))
      .catch(() => {
        // Banco pode ainda não ter sido populado (export_to_postgis.py export-all
        // não rodou) — falha silenciosa aqui, cards HAND simplesmente não aparecem.
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Mapa de risco de Blumenau</h1>
      <p className="text-slate-400 mb-4">
        Camadas HAND importadas na F2 — limite municipal, bacias contribuintes
        e zonas de suscetibilidade de Blumenau, hoje disponíveis via API
        (PostGIS). Renderização cartográfica com Leaflet entra na F4.
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {geoStatus && <p className="text-slate-500 text-sm mb-4">Status da API: {geoStatus}</p>}

      {classes && classes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {classes.map((c) => (
            <div key={c.class_id} className="border border-slate-800 rounded-lg p-4">
              <p className="text-xs uppercase text-slate-500">{c.susceptibility}</p>
              <p className="font-semibold">{c.class_label}</p>
              <p className="text-slate-400 text-sm mt-1">
                {c.percent_area != null ? `${c.percent_area}% da área` : "área indisponível"}
              </p>
              <p className="text-slate-500 text-xs mt-1">peso de risco: {c.risk_weight}</p>
            </div>
          ))}
        </div>
      )}

      {!classes && !error && (
        <p className="text-slate-500 text-sm">
          Zonas HAND ainda não carregadas — rode
          services/geo/scripts/export_to_postgis.py export-all contra o banco
          local (ver db/seeds/import_hand_blumenau.md).
        </p>
      )}
    </div>
  );
}
