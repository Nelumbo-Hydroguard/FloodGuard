import L from "leaflet";
import type { RiskLevel } from "./api";
import { RISK_THEME, type RiskTheme } from "./riskTheme";

/**
 * Fábrica dos marcadores do mapa — fonte única para `/mapa`, o mini-mapa do
 * painel e o mini-mapa do formulário SOS.
 *
 * Cada camada tem uma FORMA própria, não só uma cor: alerta é círculo,
 * abrigo é losango, sensor é quadrado e SOS é anel com miolo. Com quatro
 * camadas ligadas ao mesmo tempo, cor sozinha não distingue nada — e boa
 * parte da diferença de cor aqui já está sendo usada para severidade.
 */

export const SHELTER_COLOR = "#22d3ee";
export const SENSOR_COLOR = "#a78bfa";
export const SENSOR_OFFLINE_COLOR = "#64748b";
export const SOS_COLOR = "#f472b6";

/** Alerta: círculo na cor da severidade; crítico ganha anel pulsante. */
export function alertIcon(theme: RiskTheme, level: RiskLevel) {
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

/** Abrigo: losango ciano — nunca confundível com um ponto de risco. */
export function shelterIcon(color: string = SHELTER_COLOR) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid #040b14;transform:rotate(45deg);box-shadow:0 0 10px ${color}80;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/** Sensor: quadrado; offline fica cinza e sem halo (some do primeiro plano). */
export function sensorIcon(offline = false) {
  const color = offline ? SENSOR_OFFLINE_COLOR : SENSOR_COLOR;
  const glow = offline ? "none" : `0 0 10px ${color}99`;
  return L.divIcon({
    className: "",
    html: `<div style="width:12px;height:12px;background:${color};border:2px solid #040b14;box-shadow:${glow};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

/** Pedido SOS: anel com miolo — leitura de "chamado", não de medição. */
export function sosIcon(pending = true) {
  const opacity = pending ? 1 : 0.55;
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:18px;height:18px;opacity:${opacity};"><div style="position:absolute;inset:0;border-radius:9999px;border:2px solid ${SOS_COLOR};box-shadow:0 0 12px ${SOS_COLOR}99;"></div><div style="position:absolute;inset:5px;border-radius:9999px;background:${SOS_COLOR};"></div></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** Ponto escolhido no formulário SOS — alvo, não evento já registrado. */
export function pinIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:20px;height:20px;"><div style="position:absolute;inset:0;border-radius:9999px;border:2px dashed ${SOS_COLOR};"></div><div style="position:absolute;inset:7px;border-radius:9999px;background:${SOS_COLOR};box-shadow:0 0 10px ${SOS_COLOR};"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function riskThemeFor(level: RiskLevel) {
  return RISK_THEME[level];
}
