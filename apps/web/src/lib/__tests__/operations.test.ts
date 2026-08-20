import { describe, expect, it } from "vitest";
import {
  OCCUPANCY_THRESHOLDS,
  formatSosProtocol,
  nearestDemoRegion,
  freeSlots,
  hasErrors,
  nextSosStatus,
  occupancyLevel,
  occupancyPercent,
  shelterAvailability,
  sortSosQueue,
  sosPriorityScore,
  validateSosForm,
  waterLevelSeverity,
  type SosFormValues,
} from "../operations";
import {
  DEMO_SENSORS,
  SHELTER_CONTACTS,
  TELEMETRY_SERIES,
  buildInitialSosRequests,
  type SosRequest,
} from "../../data/demoOperations";

describe("ocupação de abrigo", () => {
  it("calcula percentual com uma casa decimal", () => {
    expect(occupancyPercent(85, 300)).toBe(28.3);
    expect(occupancyPercent(30, 150)).toBe(20);
    expect(occupancyPercent(76, 80)).toBe(95);
  });

  it("trata capacidade zero sem dividir por zero", () => {
    expect(occupancyPercent(0, 0)).toBe(0);
    expect(freeSlots(0, 0)).toBe(0);
  });

  it("nunca reporta vaga negativa quando lotado acima do limite", () => {
    expect(freeSlots(310, 300)).toBe(0);
  });

  it("classifica nas faixas de UX do protótipo", () => {
    expect(occupancyLevel(0)).toBe("normal");
    expect(occupancyLevel(59.9)).toBe("normal");
    expect(occupancyLevel(OCCUPANCY_THRESHOLDS.atencao)).toBe("atencao");
    expect(occupancyLevel(79.9)).toBe("atencao");
    expect(occupancyLevel(OCCUPANCY_THRESHOLDS.alta)).toBe("alta");
    expect(occupancyLevel(94.9)).toBe("alta");
    expect(occupancyLevel(OCCUPANCY_THRESHOLDS.lotado)).toBe("lotado");
    expect(occupancyLevel(100)).toBe("lotado");
  });

  it("não usa os limiares do motor de risco (0.25/0.50/0.75)", () => {
    expect(Object.values(OCCUPANCY_THRESHOLDS)).toEqual([60, 80, 95]);
  });

  it("abrigo indisponível não oferece vagas mesmo com espaço livre", () => {
    const availability = shelterAvailability({ capacityUsed: 0, capacityTotal: 60, unavailable: true });
    expect(availability.level).toBe("indisponivel");
    expect(availability.free).toBe(0);
  });

  it("abrigo disponível expõe vagas e percentual", () => {
    const availability = shelterAvailability({ capacityUsed: 110, capacityTotal: 200, unavailable: false });
    // 55% ainda é faixa normal: a banda vem do percentual calculado aqui, não
    // do campo `status` textual da API (que só decide se o abrigo recebe).
    expect(availability.level).toBe("normal");
    expect(availability.percent).toBe(55);
    expect(availability.free).toBe(90);
  });

  it("abrigo quase lotado cai na faixa alta", () => {
    const availability = shelterAvailability({ capacityUsed: 76, capacityTotal: 80, unavailable: false });
    expect(availability.level).toBe("lotado");
    expect(availability.percent).toBe(95);
    expect(availability.free).toBe(4);
  });
});

describe("transição de status do SOS", () => {
  it("segue aguardando → em atendimento → resolvido", () => {
    expect(nextSosStatus("aguardando")).toBe("em_atendimento");
    expect(nextSosStatus("em_atendimento")).toBe("resolvido");
  });

  it("resolvido é terminal", () => {
    expect(nextSosStatus("resolvido")).toBe("resolvido");
  });
});

describe("prioridade da fila", () => {
  const base: SosRequest = {
    id: "SOS-2026-9001",
    name: null,
    latitude: -26.9,
    longitude: -49.08,
    region: "Centro",
    peopleCount: 1,
    waterLevel: "sem_agua",
    reducedMobility: false,
    reducedMobilityCount: 0,
    description: "",
    status: "aguardando",
    createdAt: "2026-08-20T12:00:00.000Z",
    demo: true,
  };

  it("mobilidade reduzida pesa mais que nível da água", () => {
    const vulneravel = { ...base, reducedMobility: true, reducedMobilityCount: 1 };
    const agua = { ...base, waterLevel: "acima_peito" as const };
    expect(sosPriorityScore(vulneravel)).toBeGreaterThan(sosPriorityScore(agua));
  });

  it("nível da água desempata entre pedidos equivalentes", () => {
    const cintura = { ...base, waterLevel: "cintura" as const };
    const joelho = { ...base, waterLevel: "joelho" as const };
    expect(sosPriorityScore(cintura)).toBeGreaterThan(sosPriorityScore(joelho));
  });

  it("ordena abertos antes de resolvidos", () => {
    const resolvido = { ...base, id: "SOS-2026-9002", status: "resolvido" as const, reducedMobility: true, reducedMobilityCount: 3 };
    const aguardando = { ...base, id: "SOS-2026-9003" };
    const ordered = sortSosQueue([resolvido, aguardando]);
    expect(ordered.map((r) => r.id)).toEqual(["SOS-2026-9003", "SOS-2026-9002"]);
  });

  it("empate de prioridade cai para o mais antigo", () => {
    const novo = { ...base, id: "novo", createdAt: "2026-08-20T12:30:00.000Z" };
    const antigo = { ...base, id: "antigo", createdAt: "2026-08-20T11:00:00.000Z" };
    expect(sortSosQueue([novo, antigo]).map((r) => r.id)).toEqual(["antigo", "novo"]);
  });

  it("não altera o array recebido", () => {
    const input = [base, { ...base, id: "outro", reducedMobility: true, reducedMobilityCount: 2 }];
    const snapshot = input.map((r) => r.id);
    sortSosQueue(input);
    expect(input.map((r) => r.id)).toEqual(snapshot);
  });

  it("severidade do nível da água cresce do tornozelo ao peito", () => {
    expect(waterLevelSeverity("sem_agua")).toBe(0);
    expect(waterLevelSeverity("acima_peito")).toBe(5);
    expect(waterLevelSeverity("joelho")).toBeLessThan(waterLevelSeverity("cintura"));
  });
});

describe("validação do formulário SOS", () => {
  const valid: SosFormValues = {
    name: "",
    latitude: "-26.9194",
    longitude: "-49.0661",
    peopleCount: "2",
    waterLevel: "joelho",
    reducedMobility: false,
    reducedMobilityCount: "",
    description: "",
  };

  it("aceita pedido mínimo sem nome nem descrição", () => {
    expect(hasErrors(validateSosForm(valid))).toBe(false);
  });

  it("exige coordenadas dentro da faixa", () => {
    expect(validateSosForm({ ...valid, latitude: "" }).latitude).toBeDefined();
    expect(validateSosForm({ ...valid, latitude: "-91" }).latitude).toBeDefined();
    expect(validateSosForm({ ...valid, longitude: "200" }).longitude).toBeDefined();
    expect(validateSosForm({ ...valid, longitude: "abc" }).longitude).toBeDefined();
  });

  it("exige pelo menos uma pessoa, inteira", () => {
    expect(validateSosForm({ ...valid, peopleCount: "0" }).peopleCount).toBeDefined();
    expect(validateSosForm({ ...valid, peopleCount: "1.5" }).peopleCount).toBeDefined();
    expect(validateSosForm({ ...valid, peopleCount: "" }).peopleCount).toBeDefined();
  });

  it("cobra a quantidade quando há mobilidade reduzida", () => {
    const errors = validateSosForm({ ...valid, reducedMobility: true, reducedMobilityCount: "" });
    expect(errors.reducedMobilityCount).toBeDefined();
  });

  it("impede mais pessoas com mobilidade reduzida do que o total", () => {
    const errors = validateSosForm({
      ...valid,
      peopleCount: "2",
      reducedMobility: true,
      reducedMobilityCount: "3",
    });
    expect(errors.reducedMobilityCount).toBeDefined();
  });
});

describe("protocolo", () => {
  it("formata com 4 dígitos e ano", () => {
    expect(formatSosProtocol(5)).toBe("SOS-2026-0005");
    expect(formatSosProtocol(1234)).toBe("SOS-2026-1234");
  });
});

describe("região aproximada do pedido", () => {
  it("associa o ponto à região simulada mais próxima", () => {
    expect(nearestDemoRegion(-26.9194, -49.0661)).toBe("Centro");
    expect(nearestDemoRegion(-26.8994, -49.0827)).toBe("Itoupava Norte");
    expect(nearestDemoRegion(-26.9265, -49.0748)).toBe("Velha");
  });

  it("devolve null para ponto fora do território simulado", () => {
    expect(nearestDemoRegion(-23.55, -46.63)).toBeNull();
  });
});

describe("fixtures demo", () => {
  it("sensores têm id único e região conhecida do backend", () => {
    const ids = DEMO_SENSORS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const regions = new Set(["Centro", "Velha", "Itoupava Norte", "Garcia"]);
    DEMO_SENSORS.forEach((sensor) => expect(regions.has(sensor.region)).toBe(true));
  });

  it("classe HAND do sensor bate com o peso da tabela do motor", () => {
    const weightByClass: Record<number, number> = { 0: 0.9, 1: 0.6, 2: 0.3, 3: 0.1 };
    DEMO_SENSORS.forEach((sensor) => {
      expect(sensor.handRiskWeight).toBe(weightByClass[sensor.handClassId]);
    });
  });

  it("série de telemetria é determinística e referencia sensores existentes", () => {
    const sensorIds = new Set(DEMO_SENSORS.map((s) => s.id));
    TELEMETRY_SERIES.forEach((step) => expect(sensorIds.has(step.sensorId)).toBe(true));
    const offsets = TELEMETRY_SERIES.map((s) => s.offsetSeconds);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
  });

  it("série não guarda nível de risco — quem classifica é o motor", () => {
    TELEMETRY_SERIES.forEach((step) => {
      expect(step).not.toHaveProperty("risk_level");
      expect(step).not.toHaveProperty("riskLevel");
    });
  });

  it("fila inicial nasce com protocolos únicos e marcados como demo", () => {
    const requests = buildInitialSosRequests(Date.parse("2026-08-20T15:00:00.000Z"));
    const ids = requests.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    requests.forEach((request) => expect(request.demo).toBe(true));
  });

  it("horários da fila são offsets relativos, não datas fixas", () => {
    const a = buildInitialSosRequests(Date.parse("2026-08-20T15:00:00.000Z"))[0];
    const b = buildInitialSosRequests(Date.parse("2026-09-01T09:00:00.000Z"))[0];
    expect(a.createdAt).not.toBe(b.createdAt);
  });

  it("telefones de abrigo usam faixa fictícia 5550", () => {
    Object.values(SHELTER_CONTACTS).forEach((contact) => {
      expect(contact.phone).toMatch(/^\(47\) 5550-\d{4}$/);
    });
  });
});
