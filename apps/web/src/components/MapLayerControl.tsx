/**
 * Controle de camadas do mapa.
 *
 * Padrão liga só Alertas + Abrigos: são as duas camadas que respondem à
 * pergunta operacional imediata ("o que está acontecendo e para onde mando
 * as pessoas"). Sensores e pedidos SOS existem, mas entram por escolha —
 * quatro camadas ligadas de saída viram mancha de pontos sobre o município.
 */

export interface MapLayers {
  alertas: boolean;
  abrigos: boolean;
  sensores: boolean;
  sos: boolean;
}

export const DEFAULT_LAYERS: MapLayers = {
  alertas: true,
  abrigos: true,
  sensores: false,
  sos: false,
};

const ITEMS: Array<{ key: keyof MapLayers; label: string; swatch: React.ReactNode }> = [
  {
    key: "alertas",
    label: "Alertas",
    swatch: <span className="h-2.5 w-2.5 rounded-full bg-risk-critical" />,
  },
  {
    key: "abrigos",
    label: "Abrigos",
    swatch: <span className="h-2.5 w-2.5 rotate-45 bg-accent" />,
  },
  {
    key: "sensores",
    label: "Sensores",
    swatch: <span className="h-2.5 w-2.5 bg-[#a78bfa]" />,
  },
  {
    key: "sos",
    label: "Pedidos SOS",
    swatch: <span className="h-2.5 w-2.5 rounded-full border-2 border-[#f472b6]" />,
  },
];

export function MapLayerControl({
  layers,
  onChange,
  counts,
}: {
  layers: MapLayers;
  onChange: (layers: MapLayers) => void;
  counts: Partial<Record<keyof MapLayers, number>>;
}) {
  return (
    /* bottom-[92px]: o ZoomControl do Leaflet vive no canto inferior direito
       (RiskMap.tsx). Empilhar acima dele mantém os controles do mapa juntos
       sem cobrir o zoom. */
    <div className="panel-glass absolute right-6 bottom-[92px] z-[1000] w-[204px] animate-rise-in p-4">
      <p className="data-label mb-2.5">Camadas</p>
      <div className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const checked = layers[item.key];
          return (
            <label
              key={item.key}
              className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-1 py-1 text-[11px] text-slate-300 transition-colors hover:bg-navy-800/60"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange({ ...layers, [item.key]: event.target.checked })}
                className="accent-accent"
              />
              {item.swatch}
              <span className={checked ? "text-slate-200" : "text-slate-500"}>{item.label}</span>
              <span className="ml-auto font-mono text-[10px] text-slate-600">
                {counts[item.key] ?? 0}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
