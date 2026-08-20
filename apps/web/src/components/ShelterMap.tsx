import type { OperationalShelter } from "../lib/shelters";
import { OCCUPANCY_STYLE } from "../lib/operations";
import { MiniMap } from "./MiniMap";
import { shelterIcon } from "../lib/mapMarkers";
import { RISK_THEME } from "../lib/riskTheme";

/**
 * Mapa da tela de abrigos.
 *
 * O losango do abrigo é tingido pela LOTAÇÃO, não pela severidade
 * hidrológica: aqui a pergunta é "para onde ainda dá para mandar gente".
 * Indisponível fica cinza — visível, mas fora da disputa pela atenção.
 */

const BLUMENAU_CENTER: [number, number] = [-26.9194, -49.0661];

const COLOR_BY_LEVEL: Record<string, string> = {
  normal: RISK_THEME.seguro.hex,
  atencao: RISK_THEME.atencao.hex,
  alta: RISK_THEME.alerta.hex,
  lotado: RISK_THEME.critico.hex,
  indisponivel: "#64748b",
};

export function ShelterMap({
  shelters,
  onSelect,
  className = "h-[420px]",
}: {
  shelters: OperationalShelter[];
  onSelect: (shelter: OperationalShelter) => void;
  className?: string;
}) {
  return (
    <MiniMap
      className={className}
      center={BLUMENAU_CENTER}
      zoom={12}
      zoomControl
      scrollWheelZoom
      markers={shelters.map((shelter) => ({
        id: shelter.id,
        latitude: shelter.latitude,
        longitude: shelter.longitude,
        icon: shelterIcon(COLOR_BY_LEVEL[shelter.level] ?? COLOR_BY_LEVEL.normal),
        popup: (
          <div className="min-w-[200px]">
            <strong className="text-[13px] font-semibold text-white">{shelter.name}</strong>
            <p className="mt-1 text-[11px] text-slate-500">{shelter.region}</p>
            <p className="mt-2 font-mono text-sm text-slate-200">
              {shelter.free} <span className="text-slate-500">vagas</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {shelter.currentUsed}/{shelter.capacity_total} · {Math.round(shelter.percent)}% ·{" "}
              {shelter.level === "indisponivel" ? "Indisponível" : OCCUPANCY_STYLE[shelter.level].label}
            </p>
            <button
              type="button"
              onClick={() => onSelect(shelter)}
              className="mt-2 text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
            >
              Ver detalhes →
            </button>
          </div>
        ),
      }))}
    />
  );
}
