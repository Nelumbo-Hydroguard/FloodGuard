import { useMemo, useState } from "react";
import { WATER_LEVEL_OPTIONS, type SosRequest } from "../data/demoOperations";
import {
  hasErrors,
  nearestDemoRegion,
  validateSosForm,
  type SosFieldError,
  type SosFormValues,
} from "../lib/operations";
import { useOperations } from "../state/OperationsProvider";
import { MiniMap } from "./MiniMap";
import { pinIcon } from "../lib/mapMarkers";
import { SectionCard } from "./SectionCard";

/**
 * Formulário de pedido de ajuda.
 *
 * Duas decisões de produto valem registro:
 *
 * 1. NÍVEL DA ÁGUA POR REFERÊNCIA CORPORAL. Quem está com água entrando em
 *    casa não sabe informar "1,4 m" — sabe que a água está na cintura. A
 *    escala vira severidade na fila de atendimento (lib/operations.ts).
 * 2. GEOLOCALIZAÇÃO SÓ SOB CLIQUE. A Web Geolocation API é chamada apenas
 *    quando a pessoa aperta o botão, nunca no mount: pedir permissão de
 *    localização sem ação do usuário é hostil e costuma ser negado.
 *
 * O texto do formulário nunca promete resgate — o pedido é registrado e
 * entra numa fila de triagem, e é isso que a interface diz.
 */

const BLUMENAU_CENTER: [number, number] = [-26.9194, -49.0661];

const EMPTY: SosFormValues = {
  name: "",
  latitude: "",
  longitude: "",
  peopleCount: "1",
  waterLevel: "joelho",
  reducedMobility: false,
  reducedMobilityCount: "1",
  description: "",
};

function fieldClass(invalid?: boolean) {
  return `w-full rounded-lg border bg-navy-950/80 px-3 py-2 text-sm text-slate-100 transition-colors placeholder:text-slate-600 focus:outline-none ${
    invalid
      ? "border-risk-critical/70 focus:border-risk-critical"
      : "border-navy-600/80 hover:border-navy-600 focus:border-accent"
  }`;
}

const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-slate-300";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-[11px] font-normal text-risk-critical">{message}</span>;
}

export function SOSForm({ onSubmitted }: { onSubmitted: (request: SosRequest) => void }) {
  const { createSosRequest } = useOperations();
  const [values, setValues] = useState<SosFormValues>(EMPTY);
  const [errors, setErrors] = useState<SosFieldError>({});
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const set = <K extends keyof SosFormValues>(key: K, value: SosFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const markerPosition = useMemo<[number, number] | null>(() => {
    const lat = Number(values.latitude);
    const lon = Number(values.longitude);
    if (values.latitude.trim() === "" || values.longitude.trim() === "") return null;
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return [lat, lon];
  }, [values.latitude, values.longitude]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoState("error");
      setGeoMessage("Este navegador não oferece localização. Informe latitude e longitude.");
      return;
    }
    setGeoState("loading");
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        set("latitude", position.coords.latitude.toFixed(5));
        set("longitude", position.coords.longitude.toFixed(5));
        setGeoState("idle");
        setErrors((prev) => ({ ...prev, latitude: undefined, longitude: undefined }));
      },
      (error) => {
        setGeoState("error");
        // Mensagem por causa, não o código cru do browser.
        setGeoMessage(
          error.code === error.PERMISSION_DENIED
            ? "Permissão de localização negada. Informe latitude e longitude manualmente."
            : "Não foi possível obter a localização. Informe latitude e longitude manualmente.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validateSosForm(values);
    setErrors(found);
    if (hasErrors(found)) return;

    const request = createSosRequest({
      name: values.name.trim() === "" ? null : values.name.trim(),
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      region: nearestDemoRegion(Number(values.latitude), Number(values.longitude)),
      peopleCount: Number(values.peopleCount),
      waterLevel: values.waterLevel,
      reducedMobility: values.reducedMobility,
      reducedMobilityCount: values.reducedMobility ? Number(values.reducedMobilityCount) : 0,
      description: values.description.trim(),
    });
    setValues(EMPTY);
    setErrors({});
    onSubmitted(request);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <SectionCard title="Sua situação">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className={`${labelClass} md:col-span-2`}>
            Nome (opcional)
            <input
              className={fieldClass()}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Como podemos chamar você"
            />
          </label>

          <label className={labelClass}>
            Latitude
            <input
              className={fieldClass(Boolean(errors.latitude))}
              value={values.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              inputMode="decimal"
              placeholder="-26.91940"
            />
            <FieldError message={errors.latitude} />
          </label>

          <label className={labelClass}>
            Longitude
            <input
              className={fieldClass(Boolean(errors.longitude))}
              value={values.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              inputMode="decimal"
              placeholder="-49.06610"
            />
            <FieldError message={errors.longitude} />
          </label>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoState === "loading"}
              className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
            >
              {geoState === "loading" ? "Obtendo localização…" : "Usar minha localização"}
            </button>
            {geoMessage && (
              <p className="mt-2 text-[11px] leading-relaxed text-risk-attention">{geoMessage}</p>
            )}
          </div>

          <label className={labelClass}>
            Número de pessoas
            <input
              className={fieldClass(Boolean(errors.peopleCount))}
              type="number"
              min={1}
              step={1}
              value={values.peopleCount}
              onChange={(e) => set("peopleCount", e.target.value)}
            />
            <FieldError message={errors.peopleCount} />
          </label>

          <label className={labelClass}>
            Nível da água
            <select
              className={fieldClass()}
              value={values.waterLevel}
              onChange={(e) => set("waterLevel", e.target.value as SosFormValues["waterLevel"])}
            >
              {WATER_LEVEL_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-medium text-slate-300">
              Há pessoas com mobilidade reduzida?
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "Sim", value: true },
                { label: "Não", value: false },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => set("reducedMobility", option.value)}
                  aria-pressed={values.reducedMobility === option.value}
                  className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                    values.reducedMobility === option.value
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-navy-600/80 text-slate-400 hover:border-navy-600 hover:text-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}

              {values.reducedMobility && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  Quantas?
                  <input
                    className={`${fieldClass(Boolean(errors.reducedMobilityCount))} w-24`}
                    type="number"
                    min={1}
                    step={1}
                    value={values.reducedMobilityCount}
                    onChange={(e) => set("reducedMobilityCount", e.target.value)}
                  />
                </label>
              )}
            </div>
            <FieldError message={errors.reducedMobilityCount} />
          </div>

          <label className={`${labelClass} md:col-span-2`}>
            Descrição da situação
            <textarea
              className={`${fieldClass()} min-h-[88px] resize-y`}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={400}
              placeholder="Ex.: crianças, idosos, pessoa acamada, acesso bloqueado, correnteza, água subindo."
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-navy-950 shadow-[0_0_20px_var(--glow-accent)] transition-colors hover:bg-accent/90 sm:w-auto"
            >
              Enviar pedido de ajuda
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              O pedido entra na fila de triagem da operação. O envio não confirma resgate.
            </p>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Localização" subtitle={markerPosition ? undefined : "Informe ou use sua localização."}>
        <MiniMap
          className="h-[240px]"
          center={markerPosition ?? BLUMENAU_CENTER}
          zoom={markerPosition ? 15 : 12}
          recenterOnCenterChange
          markers={
            markerPosition
              ? [{ id: "sos-pin", latitude: markerPosition[0], longitude: markerPosition[1], icon: pinIcon() }]
              : []
          }
        />
        {markerPosition && (
          <p className="mt-3 font-mono text-[11px] text-slate-500">
            {markerPosition[0].toFixed(5)}, {markerPosition[1].toFixed(5)}
          </p>
        )}
      </SectionCard>
    </div>
  );
}
