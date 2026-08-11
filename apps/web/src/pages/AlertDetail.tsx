import { useParams } from "react-router-dom";

export function AlertDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Detalhe do alerta</h1>
      <p className="text-slate-400">
        Detalhe do alerta {id ?? "—"}. Severidade, descrição, recomendações e
        histórico de telemetria associada entram quando o router de alertas
        estiver conectado ao banco (F3).
      </p>
    </div>
  );
}
