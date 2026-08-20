import { useEffect, type ReactNode } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

/**
 * Mapa pequeno e reaproveitável (painel, formulário SOS, aba de abrigos).
 *
 * É o mesmo basemap escuro do `/mapa` cheio, mas sem HUD, sem legenda e sem
 * trilha: aqui o mapa é um APOIO à tela, não a tela. Controles de zoom
 * ficam desligados por padrão para não competir com o conteúdo ao lado.
 */

export interface MiniMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  icon: L.DivIcon;
  popup?: ReactNode;
  onClick?: () => void;
}

/** Recentraliza quando o alvo muda (ex.: usuário busca a própria posição). */
function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center[0], center[1], zoom, map]);
  return null;
}

export function MiniMap({
  center,
  zoom = 12,
  markers,
  className = "",
  recenterOnCenterChange = false,
  scrollWheelZoom = false,
  zoomControl = false,
}: {
  center: [number, number];
  zoom?: number;
  markers: MiniMapMarker[];
  className?: string;
  recenterOnCenterChange?: boolean;
  scrollWheelZoom?: boolean;
  zoomControl?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-navy-700/70 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={zoomControl}
        scrollWheelZoom={scrollWheelZoom}
        style={{ height: "100%", width: "100%", background: "#081726" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {recenterOnCenterChange && <Recenter center={center} zoom={zoom} />}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={marker.icon}
            eventHandlers={marker.onClick ? { click: marker.onClick } : undefined}
          >
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
