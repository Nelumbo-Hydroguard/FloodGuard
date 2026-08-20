/**
 * Regras de apoio da camada operacional (F11).
 *
 * Tudo aqui é função pura sobre dados de UI: ocupação de abrigo, fila de
 * SOS, transição de status, validação de formulário. Nada neste arquivo
 * conversa com o motor de risco.
 *
 * ⚠️ SEPARAÇÃO IMPORTANTE
 * Os limiares de ocupação de abrigo (60 / 80 / 95%) são **semântica de UX
 * deste protótipo** — servem para o operador bater o olho e saber se ainda
 * cabe gente. NÃO têm relação com os limiares do motor de risco
 * (0.25 / 0.50 / 0.75 em app/engine/risk_rules.py). Mudar um NUNCA deve
 * mudar o outro; são escalas de coisas diferentes (lotação de prédio vs.
 * severidade hidrológica). As cores coincidem só por consistência visual.
 */

import type { SosRequest, SosStatus, WaterLevelKey } from "../data/demoOperations";
import { WATER_LEVEL_OPTIONS } from "../data/demoOperations";

// --- Ocupação de abrigo -----------------------------------------------

export type OccupancyLevel = "normal" | "atencao" | "alta" | "lotado";

/** Limiares de UX do protótipo. Ver aviso no topo do arquivo. */
export const OCCUPANCY_THRESHOLDS = { atencao: 60, alta: 80, lotado: 95 } as const;

export function occupancyPercent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((used / total) * 1000) / 10;
}

export function freeSlots(used: number, total: number): number {
  return Math.max(0, total - used);
}

export function occupancyLevel(percent: number): OccupancyLevel {
  if (percent >= OCCUPANCY_THRESHOLDS.lotado) return "lotado";
  if (percent >= OCCUPANCY_THRESHOLDS.alta) return "alta";
  if (percent >= OCCUPANCY_THRESHOLDS.atencao) return "atencao";
  return "normal";
}

export const OCCUPANCY_STYLE: Record<
  OccupancyLevel,
  { label: string; badgeClass: string; barClass: string; textClass: string }
> = {
  normal: {
    label: "Disponível",
    badgeClass: "border-risk-safe/40 bg-risk-safe/10 text-risk-safe",
    barClass: "bg-risk-safe",
    textClass: "text-risk-safe",
  },
  atencao: {
    label: "Ocupação moderada",
    badgeClass: "border-risk-attention/40 bg-risk-attention/10 text-risk-attention",
    barClass: "bg-risk-attention",
    textClass: "text-risk-attention",
  },
  alta: {
    label: "Alta ocupação",
    badgeClass: "border-risk-alert/40 bg-risk-alert/10 text-risk-alert",
    barClass: "bg-risk-alert",
    textClass: "text-risk-alert",
  },
  lotado: {
    label: "Lotado",
    badgeClass: "border-risk-critical/40 bg-risk-critical/10 text-risk-critical",
    barClass: "bg-risk-critical",
    textClass: "text-risk-critical",
  },
};

/**
 * Abrigo desativado pelo operador vence qualquer cálculo de ocupação: não
 * adianta ter vaga se o local não está recebendo.
 */
export function shelterAvailability(params: {
  capacityUsed: number;
  capacityTotal: number;
  unavailable: boolean;
}): { level: OccupancyLevel | "indisponivel"; label: string; percent: number; free: number } {
  const percent = occupancyPercent(params.capacityUsed, params.capacityTotal);
  const free = freeSlots(params.capacityUsed, params.capacityTotal);
  if (params.unavailable) {
    return { level: "indisponivel", label: "Indisponível", percent, free: 0 };
  }
  const level = occupancyLevel(percent);
  return { level, label: OCCUPANCY_STYLE[level].label, percent, free };
}

// --- SOS ---------------------------------------------------------------

export const SOS_STATUS_STYLE: Record<SosStatus, { label: string; badgeClass: string }> = {
  aguardando: {
    label: "Aguardando",
    badgeClass: "border-risk-critical/40 bg-risk-critical/10 text-risk-critical",
  },
  em_atendimento: {
    label: "Em atendimento",
    badgeClass: "border-risk-attention/40 bg-risk-attention/10 text-risk-attention",
  },
  resolvido: {
    label: "Resolvido",
    badgeClass: "border-risk-safe/40 bg-risk-safe/10 text-risk-safe",
  },
};

/**
 * Avanço do pedido no fluxo. Só existe um caminho — aguardando → em
 * atendimento → resolvido — e `resolvido` é terminal: sem persistência real,
 * reabrir um chamado só criaria estado inconsistente na demo.
 */
export function nextSosStatus(status: SosStatus): SosStatus {
  if (status === "aguardando") return "em_atendimento";
  if (status === "em_atendimento") return "resolvido";
  return "resolvido";
}

export function waterLevelSeverity(key: WaterLevelKey): number {
  return WATER_LEVEL_OPTIONS.find((option) => option.key === key)?.severity ?? 0;
}

export function waterLevelLabel(key: WaterLevelKey): string {
  return WATER_LEVEL_OPTIONS.find((option) => option.key === key)?.label ?? key;
}

/**
 * Prioridade da fila, na ordem pedida pela operação:
 * 1) vulnerabilidade (pessoas com mobilidade reduzida),
 * 2) nível da água,
 * 3) mais antigo primeiro.
 *
 * Soma ponderada simples e legível de propósito — quem apresenta precisa
 * conseguir explicar por que aquele card está no topo. Não é modelo de
 * triagem clínica nem entra no motor de risco.
 */
export function sosPriorityScore(request: SosRequest): number {
  const vulnerability = request.reducedMobility ? 100 + request.reducedMobilityCount * 10 : 0;
  const water = waterLevelSeverity(request.waterLevel) * 10;
  const people = Math.min(request.peopleCount, 10);
  return vulnerability + water + people;
}

/** Pedidos abertos antes dos resolvidos; dentro do grupo, prioridade e idade. */
export function sortSosQueue(requests: SosRequest[]): SosRequest[] {
  const statusRank: Record<SosStatus, number> = {
    aguardando: 0,
    em_atendimento: 1,
    resolvido: 2,
  };
  return [...requests].sort((a, b) => {
    if (statusRank[a.status] !== statusRank[b.status]) {
      return statusRank[a.status] - statusRank[b.status];
    }
    const priority = sosPriorityScore(b) - sosPriorityScore(a);
    if (priority !== 0) return priority;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * Região aproximada de um ponto, entre as quatro regiões simuladas que o
 * backend conhece (app/engine/spatial_context.py).
 *
 * Não é geocodificação: é o vizinho mais próximo entre quatro âncoras
 * fixas, calculado localmente. Serve para o pedido chegar na fila com uma
 * referência territorial em vez de "região não informada" — sem chamar
 * serviço externo nenhum. Fora de Blumenau o resultado deixa de fazer
 * sentido, então há um raio máximo.
 */
const REGION_ANCHORS: Array<{ region: string; latitude: number; longitude: number }> = [
  { region: "Centro", latitude: -26.9194, longitude: -49.0661 },
  { region: "Velha", latitude: -26.925, longitude: -49.073 },
  { region: "Itoupava Norte", latitude: -26.898, longitude: -49.081 },
  { region: "Garcia", latitude: -26.914, longitude: -49.077 },
];

/** ~11 km em graus decimais — além disso o ponto não é mais "essa região". */
const MAX_REGION_DISTANCE_DEG = 0.1;

export function nearestDemoRegion(latitude: number, longitude: number): string | null {
  let best: { region: string; distance: number } | null = null;
  for (const anchor of REGION_ANCHORS) {
    const distance = Math.hypot(latitude - anchor.latitude, longitude - anchor.longitude);
    if (!best || distance < best.distance) best = { region: anchor.region, distance };
  }
  if (!best || best.distance > MAX_REGION_DISTANCE_DEG) return null;
  return best.region;
}

export function formatSosProtocol(sequence: number, year = 2026): string {
  return `SOS-${year}-${String(sequence).padStart(4, "0")}`;
}

export interface SosFormValues {
  name: string;
  latitude: string;
  longitude: string;
  peopleCount: string;
  waterLevel: WaterLevelKey;
  reducedMobility: boolean;
  reducedMobilityCount: string;
  description: string;
}

export type SosFieldError = Partial<Record<keyof SosFormValues, string>>;

/**
 * Validação mínima do pedido. Só barra o que impede a operação de atender:
 * sem coordenada não há para onde ir, e "0 pessoas" não é chamado. Nome e
 * descrição continuam opcionais — quem está com água na cintura não vai
 * preencher formulário completo.
 */
export function validateSosForm(values: SosFormValues): SosFieldError {
  const errors: SosFieldError = {};

  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);

  if (values.latitude.trim() === "" || Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.latitude = "Informe uma latitude entre -90 e 90.";
  }
  if (values.longitude.trim() === "" || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.longitude = "Informe uma longitude entre -180 e 180.";
  }

  const people = Number(values.peopleCount);
  if (!Number.isInteger(people) || people < 1) {
    errors.peopleCount = "Informe ao menos 1 pessoa.";
  }

  if (values.reducedMobility) {
    const reduced = Number(values.reducedMobilityCount);
    if (!Number.isInteger(reduced) || reduced < 1) {
      errors.reducedMobilityCount = "Informe quantas pessoas.";
    } else if (Number.isInteger(people) && reduced > people) {
      errors.reducedMobilityCount = "Não pode ser maior que o total de pessoas.";
    }
  }

  return errors;
}

export function hasErrors(errors: SosFieldError): boolean {
  return Object.keys(errors).length > 0;
}

// --- Formatação --------------------------------------------------------

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatRelative(iso: string, reference: number = Date.now()): string {
  const minutes = Math.max(0, Math.round((reference - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `há ${hours} h`;
}

/** Link externo de rota — Google Maps por URL, sem SDK nem chave de API. */
export function routeUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/** Telefone fictício (faixa 5550) vira `tel:` sem máscara. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
