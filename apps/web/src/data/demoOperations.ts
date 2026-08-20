/**
 * Fixtures de operação da F11 — fonte ÚNICA dos dados demo que o backend
 * ainda não expõe (sensores, série de telemetria, pedidos SOS, contatos de
 * abrigo).
 *
 * Regras que valem para tudo neste arquivo:
 *
 * 1. DETERMINÍSTICO. Nada de `Math.random()` nem `Date.now()` em valor de
 *    fixture: a demo tem que contar a mesma história em toda apresentação.
 *    Os horários são offsets em minutos, resolvidos contra o instante em
 *    que a tela monta (ver `resolveTimestamp`), para os cartões não
 *    mostrarem "há 3 dias" numa banca.
 * 2. ID ESTÁVEL. Todo objeto tem id fixo — é o que liga sensor ↔ leitura,
 *    SOS ↔ marcador do mapa, abrigo ↔ contato.
 * 3. FICTÍCIO E MARCADO. `demo: true` em todo registro. Nomes de pessoa são
 *    genéricos, telefones usam faixa reservada para demonstração e nenhum
 *    endereço é de pessoa real.
 * 4. GEOGRAFIA COERENTE. Regiões e coordenadas são as mesmas quatro já
 *    usadas pelo backend (Centro, Velha, Itoupava Norte, Garcia — ver
 *    app/engine/spatial_context.py e app/routers/shelters.py), com as
 *    classes HAND correspondentes. Ponto novo solto no mapa quebraria a
 *    coerência entre alerta, abrigo e sensor.
 */

export interface DemoSensor {
  id: string;
  label: string;
  region: string;
  latitude: number;
  longitude: number;
  /** Classe HAND da região — mesma tabela de app/engine/spatial_context.py. */
  handClassId: number;
  handRiskWeight: number;
  status: "online" | "offline";
  /** Última leitura conhecida (m / mm) — ponto de partida da série. */
  waterLevelM: number;
  previousWaterLevelM: number;
  rainfallMm: number;
  /** Minutos atrás em que a leitura chegou. Offset, não data fixa. */
  lastReadingMinutesAgo: number;
  communicationStatus: "ok" | "degraded" | "offline";
  demo: true;
}

export const DEMO_SENSORS: DemoSensor[] = [
  {
    id: "S-01",
    label: "Ribeirão Garcia — régua",
    region: "Garcia",
    latitude: -26.914,
    longitude: -49.077,
    handClassId: 2,
    handRiskWeight: 0.3,
    status: "online",
    waterLevelM: 0.34,
    previousWaterLevelM: 0.31,
    rainfallMm: 6,
    lastReadingMinutesAgo: 2,
    communicationStatus: "ok",
    demo: true,
  },
  {
    id: "S-02",
    label: "Centro — pluviômetro",
    region: "Centro",
    latitude: -26.9194,
    longitude: -49.0661,
    handClassId: 1,
    handRiskWeight: 0.6,
    status: "online",
    waterLevelM: 1.12,
    previousWaterLevelM: 1.05,
    rainfallMm: 48,
    lastReadingMinutesAgo: 1,
    communicationStatus: "ok",
    demo: true,
  },
  {
    id: "S-03",
    label: "Itoupava Norte — nível",
    region: "Itoupava Norte",
    latitude: -26.898,
    longitude: -49.081,
    handClassId: 0,
    handRiskWeight: 0.9,
    status: "online",
    waterLevelM: 2.41,
    previousWaterLevelM: 2.18,
    rainfallMm: 118,
    lastReadingMinutesAgo: 1,
    communicationStatus: "degraded",
    demo: true,
  },
  {
    id: "S-04",
    label: "Velha — régua",
    region: "Velha",
    latitude: -26.925,
    longitude: -49.073,
    handClassId: 1,
    handRiskWeight: 0.6,
    status: "online",
    waterLevelM: 1.78,
    previousWaterLevelM: 1.6,
    rainfallMm: 86,
    lastReadingMinutesAgo: 3,
    communicationStatus: "ok",
    demo: true,
  },
  {
    id: "S-05",
    label: "Itoupava Norte — pluviômetro",
    region: "Itoupava Norte",
    latitude: -26.9012,
    longitude: -49.0885,
    handClassId: 0,
    handRiskWeight: 0.9,
    status: "offline",
    waterLevelM: 1.94,
    previousWaterLevelM: 1.94,
    rainfallMm: 102,
    lastReadingMinutesAgo: 47,
    communicationStatus: "offline",
    demo: true,
  },
];

/**
 * Roteiro da simulação contínua: uma cheia se formando em Itoupava Norte
 * (S-03) enquanto o Centro (S-02) sobe devagar.
 *
 * É um SCRIPT, não um gerador: os 12 passos abaixo sempre acontecem na
 * mesma ordem, com os mesmos valores. Quem apresenta sabe exatamente
 * quando o risco vira "alerta" e quando vira "crítico". Cada passo vira uma
 * chamada ao motor de risco real (`/api/risk/evaluate-batch`) — o nível de
 * risco de cada linha NÃO está escrito aqui de propósito.
 */
export interface TelemetryStep {
  id: string;
  sensorId: string;
  /** Segundos decorridos desde o início da simulação (não relógio real). */
  offsetSeconds: number;
  rainfallMm: number;
  waterLevelM: number;
  previousWaterLevelM: number;
}

export const TELEMETRY_SERIES: TelemetryStep[] = [
  { id: "t01", sensorId: "S-03", offsetSeconds: 0, rainfallMm: 96, waterLevelM: 1.24, previousWaterLevelM: 1.19 },
  { id: "t02", sensorId: "S-02", offsetSeconds: 5, rainfallMm: 41, waterLevelM: 0.92, previousWaterLevelM: 0.9 },
  { id: "t03", sensorId: "S-03", offsetSeconds: 10, rainfallMm: 103, waterLevelM: 1.31, previousWaterLevelM: 1.24 },
  { id: "t04", sensorId: "S-04", offsetSeconds: 15, rainfallMm: 74, waterLevelM: 1.55, previousWaterLevelM: 1.5 },
  { id: "t05", sensorId: "S-03", offsetSeconds: 20, rainfallMm: 109, waterLevelM: 1.47, previousWaterLevelM: 1.31 },
  { id: "t06", sensorId: "S-02", offsetSeconds: 25, rainfallMm: 46, waterLevelM: 1.05, previousWaterLevelM: 0.92 },
  { id: "t07", sensorId: "S-03", offsetSeconds: 30, rainfallMm: 118, waterLevelM: 1.78, previousWaterLevelM: 1.47 },
  { id: "t08", sensorId: "S-04", offsetSeconds: 35, rainfallMm: 82, waterLevelM: 1.71, previousWaterLevelM: 1.55 },
  { id: "t09", sensorId: "S-03", offsetSeconds: 40, rainfallMm: 127, waterLevelM: 2.12, previousWaterLevelM: 1.78 },
  { id: "t10", sensorId: "S-02", offsetSeconds: 45, rainfallMm: 52, waterLevelM: 1.12, previousWaterLevelM: 1.05 },
  { id: "t11", sensorId: "S-03", offsetSeconds: 50, rainfallMm: 136, waterLevelM: 2.41, previousWaterLevelM: 2.12 },
  { id: "t12", sensorId: "S-03", offsetSeconds: 55, rainfallMm: 142, waterLevelM: 2.68, previousWaterLevelM: 2.41 },
];

/** Nível da água descrito por referência corporal, não por metro exato. */
export type WaterLevelKey =
  | "sem_agua"
  | "tornozelo"
  | "joelho"
  | "cintura"
  | "peito"
  | "acima_peito";

export interface WaterLevelOption {
  key: WaterLevelKey;
  label: string;
  /** 0 a 5 — usado só para ordenar a fila, não é entrada do motor de risco. */
  severity: number;
}

export const WATER_LEVEL_OPTIONS: WaterLevelOption[] = [
  { key: "sem_agua", label: "Sem água", severity: 0 },
  { key: "tornozelo", label: "Até o tornozelo", severity: 1 },
  { key: "joelho", label: "Até o joelho", severity: 2 },
  { key: "cintura", label: "Até a cintura", severity: 3 },
  { key: "peito", label: "Até o peito", severity: 4 },
  { key: "acima_peito", label: "Acima do peito", severity: 5 },
];

export type SosStatus = "aguardando" | "em_atendimento" | "resolvido";

export interface SosRequest {
  /** Protocolo demonstrativo — SOS-2026-XXXX. Também é o id. */
  id: string;
  name: string | null;
  latitude: number;
  longitude: number;
  region: string | null;
  peopleCount: number;
  waterLevel: WaterLevelKey;
  reducedMobility: boolean;
  reducedMobilityCount: number;
  description: string;
  status: SosStatus;
  /** ISO. Fixtures nascem com offset; envios do formulário usam o relógio. */
  createdAt: string;
  demo: true;
}

/**
 * Fila inicial. Offsets em minutos viram ISO em `buildInitialSosRequests`,
 * para os horários lerem como "há pouco" em qualquer dia de apresentação.
 */
const SEED_SOS: Array<Omit<SosRequest, "createdAt" | "demo"> & { minutesAgo: number }> = [
  {
    id: "SOS-2026-0001",
    name: "Solicitante demo 1",
    latitude: -26.8994,
    longitude: -49.0827,
    region: "Itoupava Norte",
    peopleCount: 4,
    waterLevel: "cintura",
    reducedMobility: true,
    reducedMobilityCount: 1,
    description: "Água subindo rápido. Idoso acamado no imóvel, acesso pela rua principal bloqueado.",
    status: "aguardando",
    minutesAgo: 6,
  },
  {
    id: "SOS-2026-0002",
    name: null,
    latitude: -26.9265,
    longitude: -49.0748,
    region: "Velha",
    peopleCount: 2,
    waterLevel: "joelho",
    reducedMobility: false,
    reducedMobilityCount: 0,
    description: "Duas pessoas no primeiro andar, água entrando na garagem.",
    status: "aguardando",
    minutesAgo: 14,
  },
  {
    id: "SOS-2026-0003",
    name: "Solicitante demo 3",
    latitude: -26.9188,
    longitude: -49.0672,
    region: "Centro",
    peopleCount: 6,
    waterLevel: "tornozelo",
    reducedMobility: true,
    reducedMobilityCount: 2,
    description: "Grupo com duas crianças pequenas e uma pessoa em cadeira de rodas.",
    status: "em_atendimento",
    minutesAgo: 28,
  },
  {
    id: "SOS-2026-0004",
    name: "Solicitante demo 4",
    latitude: -26.9151,
    longitude: -49.0782,
    region: "Garcia",
    peopleCount: 1,
    waterLevel: "sem_agua",
    reducedMobility: false,
    reducedMobilityCount: 0,
    description: "Solicitou orientação sobre local seguro mais próximo.",
    status: "resolvido",
    minutesAgo: 52,
  },
];

function minutesAgoToIso(minutes: number, reference: number): string {
  return new Date(reference - minutes * 60_000).toISOString();
}

export function buildInitialSosRequests(reference: number = Date.now()): SosRequest[] {
  return SEED_SOS.map(({ minutesAgo, ...rest }) => ({
    ...rest,
    createdAt: minutesAgoToIso(minutesAgo, reference),
    demo: true as const,
  }));
}

/** Maior sequencial das fixtures — o formulário continua a partir daqui. */
export const SOS_SEQUENCE_START = SEED_SOS.length;

/**
 * Campos operacionais de abrigo que `/api/shelters/demo` não devolve.
 * Chaveado pelo id que a API já usa, então some sozinho se o backend um dia
 * passar a mandar esses campos.
 *
 * Telefones ficam na faixa (47) 5550-XXXX, reservada para ficção — discar
 * não alcança ninguém. Nenhum contato real entra aqui.
 */
export interface ShelterContact {
  phone: string;
  accessibility: string;
  operationalNote: string;
  updatedMinutesAgo: number;
  demo: true;
}

export const SHELTER_CONTACTS: Record<string, ShelterContact> = {
  "sim-abrigo-centro": {
    phone: "(47) 5550-0101",
    accessibility: "Rampa de acesso, banheiro adaptado",
    operationalNote: "Recebendo encaminhamentos. Cozinha em operação.",
    updatedMinutesAgo: 4,
    demo: true,
  },
  "sim-abrigo-velha": {
    phone: "(47) 5550-0102",
    accessibility: "Rampa de acesso",
    operationalNote: "Colchões disponíveis. Confirmar antes de encaminhar grupo grande.",
    updatedMinutesAgo: 11,
    demo: true,
  },
  "sim-abrigo-itoupava-norte": {
    phone: "(47) 5550-0103",
    accessibility: "Sem acessibilidade confirmada",
    operationalNote: "Próximo do limite de capacidade. Encaminhar apenas casos urgentes.",
    updatedMinutesAgo: 3,
    demo: true,
  },
  "sim-abrigo-garcia": {
    phone: "(47) 5550-0104",
    accessibility: "Rampa de acesso, banheiro adaptado",
    operationalNote: "Fechado para manutenção simulada. Não encaminhar.",
    updatedMinutesAgo: 65,
    demo: true,
  },
};

export function resolveTimestamp(minutesAgo: number, reference: number = Date.now()): string {
  return minutesAgoToIso(minutesAgo, reference);
}
