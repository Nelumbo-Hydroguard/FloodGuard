import { describe, expect, it } from "vitest";
import {
  OPERATIONAL_ACTION_LABEL,
  PUBLIC_GUIDANCE_DISCLAIMER,
  PUBLIC_GUIDANCE_LABEL,
  getOperationalRecommendation,
  getOperationalRecommendationShort,
  getPublicGuidance,
  getPublicHeadline,
  getPublicLevelLabel,
  isRiskLevel,
} from "../alertMessaging";
import { RISK_LEVELS_ORDERED } from "../riskTheme";

/**
 * Estes testes guardam uma regra de PRODUTO, não de implementação: o
 * FloodGuard não tem autoridade para determinar evacuação, e as mensagens
 * de operador e de cidadão não podem voltar a se misturar.
 */

// Verbos de ordem/garantia que o motor não pode emitir sozinho. "evacuação"
// aparece na lista na forma de ordem ("ordenar evacuação", "evacue"); a
// palavra sozinha num contexto condicional da autoridade é outra coisa.
const FORBIDDEN_AUTOMATIC = [
  "evacue",
  "evacuar",
  "ordenar evacuação",
  "ordene",
  "evacuação imediata",
  "garantir segurança",
  "garantimos",
  "risco de morte",
  "perigo!!!",
];

describe("cobertura de níveis", () => {
  it("todos os níveis têm ação operacional recomendada", () => {
    for (const level of RISK_LEVELS_ORDERED) {
      expect(getOperationalRecommendation(level).length).toBeGreaterThan(20);
    }
  });

  it("todos os níveis têm ação operacional curta", () => {
    for (const level of RISK_LEVELS_ORDERED) {
      const short = getOperationalRecommendationShort(level);
      expect(short.length).toBeGreaterThan(10);
      // Curta de verdade — cabe no popup do mapa sem line-clamp cortar.
      expect(short.length).toBeLessThanOrEqual(90);
      expect(short.length).toBeLessThan(getOperationalRecommendation(level).length);
    }
  });

  it("todos os níveis têm orientação à população", () => {
    for (const level of RISK_LEVELS_ORDERED) {
      expect(getPublicGuidance(level).length).toBeGreaterThan(20);
    }
  });

  it("todos os níveis têm manchete cidadã e rótulo de nível", () => {
    for (const level of RISK_LEVELS_ORDERED) {
      expect(getPublicHeadline(level).length).toBeGreaterThan(10);
      expect(getPublicLevelLabel(level)).not.toBe("Indeterminado");
    }
  });

  it("nenhuma mensagem se repete entre níveis", () => {
    const operational = RISK_LEVELS_ORDERED.map((l) => getOperationalRecommendation(l));
    const publicGuidance = RISK_LEVELS_ORDERED.map((l) => getPublicGuidance(l));
    expect(new Set(operational).size).toBe(RISK_LEVELS_ORDERED.length);
    expect(new Set(publicGuidance).size).toBe(RISK_LEVELS_ORDERED.length);
  });
});

describe("separação de públicos", () => {
  it("orientação à população nunca repete a ação operacional", () => {
    for (const level of RISK_LEVELS_ORDERED) {
      expect(getPublicGuidance(level)).not.toBe(getOperationalRecommendation(level));
      expect(getPublicGuidance(level)).not.toBe(getOperationalRecommendationShort(level));
    }
  });

  it("orientação à população não usa jargão operacional", () => {
    const jargon = ["plano de contingência", "equipe", "monitoramento", "comunicação preventiva"];
    for (const level of RISK_LEVELS_ORDERED) {
      const text = getPublicGuidance(level).toLowerCase();
      for (const term of jargon) {
        expect(text).not.toContain(term);
      }
    }
  });

  it("orientação à população nunca expõe número técnico", () => {
    // Fronteira de palavra: "acompanhando" contém "hand" sem ser jargão.
    const technical = [/\bscore\b/, /\bconfian[çc]a\b/, /\bhand\b/, /\bpeso/, /\bf[óo]rmula\b/, /\bpayload\b/, /%/];
    for (const level of RISK_LEVELS_ORDERED) {
      const text = `${getPublicHeadline(level)} ${getPublicGuidance(level)}`.toLowerCase();
      for (const term of technical) {
        expect(text).not.toMatch(term);
      }
      expect(text).not.toMatch(/\d/);
    }
  });

  it("os rótulos nomeiam o público — nunca 'Ação recomendada' sozinha", () => {
    expect(OPERATIONAL_ACTION_LABEL).toBe("Ação operacional recomendada");
    expect(PUBLIC_GUIDANCE_LABEL).toBe("Orientação à população");
    expect(PUBLIC_GUIDANCE_DISCLAIMER.toLowerCase()).toContain("demonstrativo");
  });
});

describe("autoridade da Defesa Civil", () => {
  it("nenhuma mensagem automática ordena evacuação ou promete segurança", () => {
    for (const level of RISK_LEVELS_ORDERED) {
      const texts = [
        getOperationalRecommendation(level),
        getOperationalRecommendationShort(level),
        getPublicGuidance(level),
        getPublicHeadline(level),
      ];
      for (const text of texts) {
        for (const phrase of FORBIDDEN_AUTOMATIC) {
          expect(text.toLowerCase()).not.toContain(phrase);
        }
      }
    }
  });

  it("o crítico operacional subordina a ação à validação da Defesa Civil", () => {
    expect(getOperationalRecommendation("critico").toLowerCase()).toContain("defesa civil");
  });

  it("o crítico cidadão trata o deslocamento como condicional, não como ordem", () => {
    const text = getPublicGuidance("critico").toLowerCase();
    expect(text).toContain("caso seja determinado o deslocamento");
    expect(text).toContain("defesa civil");
  });

  it("nenhuma mensagem promete ausência de risco", () => {
    for (const level of RISK_LEVELS_ORDERED) {
      const text = `${getOperationalRecommendation(level)} ${getPublicGuidance(level)}`.toLowerCase();
      expect(text).not.toContain("nenhuma ação necessária");
      expect(text).not.toContain("sem risco");
    }
  });

  it("nenhuma mensagem grita — sem caixa alta nem múltiplas exclamações", () => {
    for (const level of RISK_LEVELS_ORDERED) {
      const texts = [getOperationalRecommendation(level), getPublicGuidance(level)];
      for (const text of texts) {
        expect(text).not.toMatch(/[A-ZÀ-Ú]{4,}/);
        expect(text).not.toContain("!!");
      }
    }
  });
});

describe("fallback de nível desconhecido", () => {
  it("isRiskLevel só aceita os 4 níveis do contrato", () => {
    for (const level of RISK_LEVELS_ORDERED) expect(isRiskLevel(level)).toBe(true);
    for (const bogus of ["emergencia", "SEGURO", "", null, undefined, 3, {}]) {
      expect(isRiskLevel(bogus)).toBe(false);
    }
  });

  it("nível desconhecido não vira 'seguro' — nunca subestima o risco", () => {
    const operational = getOperationalRecommendation("emergencia");
    const guidance = getPublicGuidance("emergencia");
    expect(operational).not.toBe(getOperationalRecommendation("seguro"));
    expect(guidance).not.toBe(getPublicGuidance("seguro"));
    expect(operational.toLowerCase()).toContain("não reconhecido");
    expect(guidance.toLowerCase()).toContain("defesa civil");
    expect(getPublicLevelLabel("emergencia")).toBe("Indeterminado");
    expect(getOperationalRecommendationShort(null).length).toBeGreaterThan(10);
    expect(getPublicHeadline(undefined).length).toBeGreaterThan(10);
  });
});

describe("compatibilidade com o contrato da API", () => {
  it("a ação vinda do backend tem prioridade sobre a tabela local", () => {
    expect(getOperationalRecommendation("alerta", "Texto vindo do motor.")).toBe(
      "Texto vindo do motor.",
    );
  });

  it("campo vazio, em branco ou nulo cai no fallback local", () => {
    for (const empty of ["", "   ", null, undefined]) {
      expect(getOperationalRecommendation("alerta", empty)).toBe(
        getOperationalRecommendation("alerta"),
      );
    }
  });

  it("nível desconhecido com texto do backend ainda usa o texto do backend", () => {
    expect(getOperationalRecommendation("emergencia", "Ação do motor.")).toBe("Ação do motor.");
  });
});
