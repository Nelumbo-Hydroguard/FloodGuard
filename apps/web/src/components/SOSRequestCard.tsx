import { Link } from "react-router-dom";
import type { SosRequest } from "../data/demoOperations";
import {
  SOS_STATUS_STYLE,
  formatClock,
  formatRelative,
  waterLevelLabel,
  waterLevelSeverity,
} from "../lib/operations";
import { DemoBadge } from "./DemoBadge";

/**
 * Card de pedido SOS.
 *
 * `variant="queue"` é a versão da central de atendimento: traz descrição,
 * coordenada e os botões de fluxo. `variant="compact"` é a lista pública em
 * /sos, que mostra o mínimo — não expõe descrição nem coordenada exata de
 * terceiros numa tela aberta.
 */

const HIGH_WATER = 3; // cintura ou acima — destaca a barra lateral do card

export function SOSRequestCard({
  request,
  variant = "queue",
  onAdvance,
}: {
  request: SosRequest;
  variant?: "queue" | "compact";
  onAdvance?: (id: string) => void;
}) {
  const status = SOS_STATUS_STYLE[request.status];
  const urgent = request.reducedMobility || waterLevelSeverity(request.waterLevel) >= HIGH_WATER;
  const open = request.status !== "resolvido";

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-navy-800/70 px-1 py-3 last:border-b-0">
        <span className="font-mono text-[11px] text-slate-500">{request.id}</span>
        <span className="text-sm text-slate-200">{request.name ?? "Anônimo"}</span>
        <span className="text-xs text-slate-500">
          {request.peopleCount} {request.peopleCount === 1 ? "pessoa" : "pessoas"}
        </span>
        {request.reducedMobility && (
          <span className="text-xs text-risk-attention">
            {request.reducedMobilityCount} com mobilidade reduzida
          </span>
        )}
        <span className="text-xs text-slate-500">{waterLevelLabel(request.waterLevel)}</span>
        <span className="text-xs text-slate-600">{formatClock(request.createdAt)}</span>
        <span
          className={`ml-auto inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${status.badgeClass}`}
        >
          {status.label}
        </span>
      </div>
    );
  }

  return (
    <article className="panel panel-interactive overflow-hidden">
      {/* Filete lateral marca urgência antes da leitura do texto. */}
      <span
        className={`absolute inset-y-0 left-0 w-[3px] ${
          !open ? "bg-risk-safe" : urgent ? "bg-risk-critical" : "bg-risk-attention"
        }`}
      />
      <div className="flex flex-col gap-4 p-5 pl-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-500">{request.id}</span>
              <DemoBadge />
            </div>
            <h3 className="mt-1 font-display text-base font-semibold text-white">
              {request.name ?? "Anônimo"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {request.region ?? "Região não informada"} · {formatClock(request.createdAt)} ·{" "}
              {formatRelative(request.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${status.badgeClass}`}
          >
            {status.label}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <div>
            <dt className="data-label">Pessoas</dt>
            <dd className="mt-1 font-mono text-xl font-semibold leading-none text-white">
              {request.peopleCount}
            </dd>
          </div>
          <div>
            <dt className="data-label">Mobilidade reduzida</dt>
            <dd
              className={`mt-1 font-mono text-xl font-semibold leading-none ${
                request.reducedMobility ? "text-risk-critical" : "text-slate-500"
              }`}
            >
              {request.reducedMobility ? request.reducedMobilityCount : "—"}
            </dd>
          </div>
          <div>
            <dt className="data-label">Nível da água</dt>
            <dd className="mt-1 text-sm font-medium leading-tight text-slate-200">
              {waterLevelLabel(request.waterLevel)}
            </dd>
          </div>
          <div>
            <dt className="data-label">Localização</dt>
            <dd className="mt-1 font-mono text-[11px] leading-tight text-slate-400">
              {request.latitude.toFixed(4)}
              <br />
              {request.longitude.toFixed(4)}
            </dd>
          </div>
        </dl>

        {request.description && (
          <p className="rounded-lg border border-navy-700/70 bg-navy-950/60 p-3 text-sm leading-relaxed text-slate-300">
            {request.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {request.status === "aguardando" && onAdvance && (
            <button
              type="button"
              onClick={() => onAdvance(request.id)}
              className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-navy-950 transition-colors hover:bg-accent/90"
            >
              Iniciar atendimento
            </button>
          )}
          {request.status === "em_atendimento" && onAdvance && (
            <button
              type="button"
              onClick={() => onAdvance(request.id)}
              className="rounded-lg border border-risk-safe/50 bg-risk-safe/10 px-3.5 py-2 text-xs font-semibold text-risk-safe transition-colors hover:bg-risk-safe/20"
            >
              Marcar como resolvido
            </button>
          )}
          <Link
            to={`/mapa?sos=${request.id}`}
            className="rounded-lg border border-navy-600 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            Ver no mapa →
          </Link>
          <Link
            to="/abrigos"
            className="rounded-lg border border-navy-600 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            Encaminhar para abrigo
          </Link>
        </div>
      </div>
    </article>
  );
}
